import 'package:irshad_mobile/core/api/api_service.dart';

class ChatService {
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;
  ChatService._internal();

  Future<List<Map<String, dynamic>>> fetchConversations() async {
    final response = await ApiService().get('chat/conversations');
    final raw = response.data['data'] as List<dynamic>? ?? [];
    return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>> fetchConversation(int id) async {
    final response = await ApiService().get('chat/conversations/$id');
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> sendMessage(String message, {int? conversationId}) async {
    final payload = <String, dynamic>{'message': message};
    if (conversationId != null) {
      payload['conversation_id'] = conversationId;
    }
    final response = await ApiService().post('chat/message', payload);
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> submitFeedback(int messageId, String feedback) async {
    await ApiService().post('chat/messages/$messageId/feedback', {
      'feedback': feedback,
    });
  }

  Future<Map<String, dynamic>> escalateConversation(int conversationId, {String? note}) async {
    final payload = <String, dynamic>{};
    if (note != null && note.trim().isNotEmpty) {
      payload['note'] = note.trim();
    }
    final response = await ApiService().post('chat/conversations/$conversationId/escalate', payload);
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> resumeAiConversation(int conversationId) async {
    final response = await ApiService().post('chat/conversations/$conversationId/resume-ai', {});
    return Map<String, dynamic>.from(response.data as Map);
  }
}
