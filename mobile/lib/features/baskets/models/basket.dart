class Basket {
  final int id;
  final String name;
  final String? description;
  final List<String> symbols;
  final bool isActive;

  Basket({
    required this.id,
    required this.name,
    this.description,
    required this.symbols,
    required this.isActive,
  });

  factory Basket.fromJson(Map<String, dynamic> json) {
    return Basket(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      symbols: List<String>.from(json['symbols'] ?? []),
      isActive: json['is_active'] == 1 || json['is_active'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'symbols': symbols,
      'is_active': isActive,
    };
  }
}
