class RentalPackage {
  final String id;
  final String name;
  final String mushroomType;
  final int durationDays;
  final double price;
  final String description;

  RentalPackage({
    required this.id,
    required this.name,
    required this.mushroomType,
    required this.durationDays,
    required this.price,
    required this.description,
  });
}

class CustomerTray {
  final String trayCode;
  final String mushroomType;
  final String roomName;
  final String growthStage;
  final int progressPercent;
  final String expectedHarvestDate;
  final double temperature;
  final double humidity;
  final int co2Level;

  CustomerTray({
    required this.trayCode,
    required this.mushroomType,
    required this.roomName,
    required this.growthStage,
    required this.progressPercent,
    required this.expectedHarvestDate,
    required this.temperature,
    required this.humidity,
    required this.co2Level,
  });
}