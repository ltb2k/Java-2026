package vn.edu.mushroom.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AppException extends RuntimeException {
    private final HttpStatus status;
    private final Object details;

    public AppException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
        this.details = null;
    }

    public AppException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.details = null;
    }

    public AppException(String message, HttpStatus status, Object details) {
        super(message);
        this.status = status;
        this.details = details;
    }

    public static AppException badRequest(String message) {
        return new AppException(message, HttpStatus.BAD_REQUEST);
    }

    public static AppException notFound(String message) {
        return new AppException(message, HttpStatus.NOT_FOUND);
    }

    public static AppException unauthorized(String message) {
        return new AppException(message, HttpStatus.UNAUTHORIZED);
    }

    public static AppException forbidden(String message) {
        return new AppException(message, HttpStatus.FORBIDDEN);
    }

    public static AppException conflict(String message) {
        return new AppException(message, HttpStatus.CONFLICT);
    }

    public static AppException locked(String message) {
        return new AppException(message, HttpStatus.LOCKED);
    }
}
