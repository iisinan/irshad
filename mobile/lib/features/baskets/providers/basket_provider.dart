import 'package:flutter/foundation.dart';
import '../data/basket_repository.dart';
import '../models/basket.dart';

class BasketProvider extends ChangeNotifier {
  final BasketRepository _repository = BasketRepository();

  List<Basket> _baskets = [];
  bool _isLoading = false;
  String? _error;

  List<Basket> get baskets => _baskets;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchBaskets() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _baskets = await _repository.fetchBaskets();
    } catch (e) {
      _error = 'Failed to load baskets';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> investInBasket(int basketId, double amount) async {
    return await _repository.investInBasket(basketId, amount);
  }
}
