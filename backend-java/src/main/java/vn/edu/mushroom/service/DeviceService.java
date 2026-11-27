package vn.edu.mushroom.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.request.DeviceCommandRequest;
import vn.edu.mushroom.dto.request.DeviceRequest;
import vn.edu.mushroom.dto.response.DeviceResponse;
import vn.edu.mushroom.entity.Device;
import vn.edu.mushroom.entity.DeviceCommand;
import vn.edu.mushroom.entity.Room;
import vn.edu.mushroom.entity.Tray;
import vn.edu.mushroom.entity.User;
import vn.edu.mushroom.entity.enums.CommandStatus;
import vn.edu.mushroom.entity.enums.DeviceStatus;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.*;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeoutException;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final RoomRepository roomRepository;
    private final TrayRepository trayRepository;
    private final DeviceCommandRepository commandRepository;
    private final UserRepository userRepository;
    private final MqttService mqttService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Set<String> VALID_ACTIONS = Set.of(
            "TURN_ON", "TURN_OFF", "TOGGLE", "SET_SPEED", "CONFIG"
    );

    @Transactional(readOnly = true)
    public List<DeviceResponse> listDevices(Integer roomId, String deviceType, DeviceStatus status) {
        return deviceRepository.findWithFilters(roomId, deviceType, status).stream()
                .map(DeviceResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public DeviceResponse getDeviceById(Integer id) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Thiết bị không tồn tại"));
        return DeviceResponse.fromEntity(device);
    }

    @Transactional
    public DeviceResponse createDevice(DeviceRequest request) {
        Room room = null;
        if (request.getRoom_id() != null) {
            room = roomRepository.findById(request.getRoom_id())
                    .orElseThrow(() -> AppException.notFound("Phòng trồng không tồn tại"));
        }

        Tray tray = null;
        if (request.getTray_id() != null) {
            tray = trayRepository.findById(request.getTray_id())
                    .orElseThrow(() -> AppException.notFound("Khay trồng không tồn tại"));
        }

        Device device = Device.builder()
                .name(request.getName().trim())
                .deviceType(request.getDevice_type().trim())
                .room(room)
                .tray(tray)
                .isOn(request.getIs_on() != null ? request.getIs_on() : false)
                .status(request.getStatus() != null ? request.getStatus() : DeviceStatus.ONLINE)
                .build();

        return DeviceResponse.fromEntity(deviceRepository.save(device));
    }

    @Transactional
    public DeviceResponse updateDevice(Integer id, DeviceRequest request) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Thiết bị không tồn tại"));

        if (request.getName() != null) device.setName(request.getName().trim());
        if (request.getDevice_type() != null) device.setDeviceType(request.getDevice_type().trim());

        if (request.getRoom_id() != null) {
            Room room = roomRepository.findById(request.getRoom_id())
                    .orElseThrow(() -> AppException.notFound("Phòng trồng không tồn tại"));
            device.setRoom(room);
        }

        if (request.getTray_id() != null) {
            Tray tray = trayRepository.findById(request.getTray_id())
                    .orElseThrow(() -> AppException.notFound("Khay trồng không tồn tại"));
            device.setTray(tray);
        }

        if (request.getIs_on() != null) device.setIsOn(request.getIs_on());
        if (request.getStatus() != null) device.setStatus(request.getStatus());

        return DeviceResponse.fromEntity(deviceRepository.save(device));
    }

    @Transactional
    public Map<String, Object> deleteDevice(Integer id) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Thiết bị không tồn tại"));
        deviceRepository.delete(device);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Xóa thiết bị thành công");
        return result;
    }

    /**
     * Send manual control command to device and await 10s ACK from ESP32.
     * SRS constraint: Không có ACK sau 10 giây không báo thành công.
     */
    @Transactional
    public Map<String, Object> sendDeviceCommand(Integer deviceId, DeviceCommandRequest request, Integer userId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> AppException.notFound("Thiết bị không tồn tại"));

        String action = request.getAction().toUpperCase().trim();
        if (!VALID_ACTIONS.contains(action)) {
            throw AppException.badRequest("Lệnh điều khiển không hợp lệ: " + action);
        }

        String commandId = UUID.randomUUID().toString();
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        String payloadJson = null;
        try {
            if (request.getPayload() != null) {
                payloadJson = objectMapper.writeValueAsString(request.getPayload());
            }
        } catch (Exception ignored) {
        }

        // 1. Record command in PENDING state
        DeviceCommand cmd = DeviceCommand.builder()
                .commandId(commandId)
                .device(device)
                .action(action)
                .payload(payloadJson)
                .status(CommandStatus.PENDING)
                .issuedBy(user)
                .build();
        commandRepository.save(cmd);

        // 2. Transmit via MQTT and await 10-second ACK
        CompletableFuture<Map<String, Object>> ackFuture = mqttService.sendCommand(
                deviceId,
                commandId,
                action,
                request.getPayload(),
                10 // 10 seconds timeout
        );

        Map<String, Object> ackResult;
        try {
            ackResult = ackFuture.join();
        } catch (Exception e) {
            ackResult = new HashMap<>();
            if (e.getCause() instanceof TimeoutException) {
                ackResult.put("status", "TIMEOUT");
                ackResult.put("message", "Thiết bị không phản hồi trong 10 giây (ACK Timeout)");
            } else {
                ackResult.put("status", "FAILED");
                ackResult.put("message", "Lỗi truyền lệnh: " + e.getMessage());
            }
        }

        String statusStr = (String) ackResult.get("status");

        if ("ACKED".equalsIgnoreCase(statusStr)) {
            // Update device isOn state
            if ("TURN_ON".equals(action)) device.setIsOn(true);
            else if ("TURN_OFF".equals(action)) device.setIsOn(false);
            else if ("TOGGLE".equals(action)) device.setIsOn(!device.getIsOn());

            deviceRepository.save(device);

            cmd.setStatus(CommandStatus.ACKED);
            cmd.setAckedAt(OffsetDateTime.now());
            try {
                cmd.setResult(objectMapper.writeValueAsString(ackResult));
            } catch (Exception ignored) {}
            commandRepository.save(cmd);

            Map<String, Object> resp = new HashMap<>();
            resp.put("status", "ACKED");
            resp.put("command_id", commandId);
            resp.put("device", DeviceResponse.fromEntity(device));
            resp.put("message", "Thiết bị đã thực thi lệnh thành công (ACK)");
            return resp;
        } else {
            CommandStatus finalStatus = "TIMEOUT".equalsIgnoreCase(statusStr) ? CommandStatus.TIMEOUT : CommandStatus.FAILED;
            cmd.setStatus(finalStatus);
            cmd.setResult((String) ackResult.get("message"));
            commandRepository.save(cmd);

            HttpStatus errHttp = finalStatus == CommandStatus.TIMEOUT ? HttpStatus.GATEWAY_TIMEOUT : HttpStatus.BAD_GATEWAY;
            Map<String, Object> details = new HashMap<>();
            details.put("command_id", commandId);
            details.put("status", finalStatus.name());

            throw new AppException(
                    (String) ackResult.getOrDefault("message", "Không nhận được phản hồi ACK từ thiết bị trong 10 giây"),
                    errHttp,
                    details
            );
        }
    }

    @Transactional(readOnly = true)
    public List<DeviceCommand> getDeviceCommandHistory(Integer deviceId) {
        return commandRepository.findByDeviceIdOrderByCreatedAtDesc(deviceId);
    }
}
