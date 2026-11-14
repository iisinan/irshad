class Basket {
  final int id;
  final String name;
  final String? description;
  final List<String> symbols;
  final bool isActive;
  final int? userId;
  final bool isLocked;
  final String? requiredTier;

  Basket({
    required this.id,
    required this.name,
    this.description,
    required this.symbols,
    required this.isActive,
    this.userId,
    this.isLocked = false,
    this.requiredTier,
  });

  factory Basket.fromJson(Map<String, dynamic> json) {
    return Basket(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      symbols: List<String>.from(json['symbols'] ?? []),
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      userId: json['user_id'],
      isLocked: json['is_locked'] == true || json['is_locked'] == 1,
      requiredTier: json['required_tier']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'symbols': symbols,
      'is_active': isActive,
      'user_id': userId,
      'is_locked': isLocked,
      'required_tier': requiredTier,
    };
  }
}
