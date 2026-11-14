class Basket {
  final int id;
  final String name;
  final String? description;
  final List<String> symbols;
  final bool isActive;
  final int? userId;
  final int? stockCount;
  final bool isLocked;
  final String? requiredTier;

  Basket({
    required this.id,
    required this.name,
    this.description,
    required this.symbols,
    required this.isActive,
    this.userId,
    this.stockCount,
    this.isLocked = false,
    this.requiredTier,
  });

  factory Basket.fromJson(Map<String, dynamic> json) {
    final rawSymbols = json['symbols'] ?? json['symbols_preview'] ?? [];
    return Basket(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      symbols: List<String>.from(rawSymbols),
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      userId: json['user_id'],
      stockCount: json['stock_count'] is int
          ? json['stock_count']
          : int.tryParse(json['stock_count']?.toString() ?? ''),
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
      'stock_count': stockCount,
      'is_locked': isLocked,
      'required_tier': requiredTier,
    };
  }
}
