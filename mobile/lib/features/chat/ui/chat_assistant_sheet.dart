import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';
import 'package:irshad_mobile/core/widgets/upgrade_paywall_bottom_sheet.dart';
import '../../stocks/ui/stock_detail_screen.dart';
import '../services/chat_service.dart';

class ChatAssistantSheet extends StatefulWidget {
  const ChatAssistantSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const ChatAssistantSheet(),
    );
  }

  @override
  State<ChatAssistantSheet> createState() => _ChatAssistantSheetState();
}

class _ChatAssistantSheetState extends State<ChatAssistantSheet> {
  final ChatService _chatService = ChatService();
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  static const List<String> _starterPrompts = [
    'How does AAOIFI screening work?',
    'Is MTNN Halal?',
    'How do Zakat & Hawl work?',
    'How does dividend purification work?',
    'I need account help',
  ];

  bool _showingHistory = false;
  bool _isSending = false;
  bool _isLoadingHistory = false;
  bool _isEscalating = false;

  Map<String, dynamic>? _activeConversation;
  List<Map<String, dynamic>> _messages = [];
  List<Map<String, dynamic>> _conversations = [];

  static final RegExp _sensitiveAssistantTerms = RegExp(
    r'\b(upgrade|upgrading|pricing|subscribe|subscription|billing|membership|memberships|plan|plans|rawdha|noor|miftah|unlocked|unlock)\b',
    caseSensitive: false,
  );

  String _sanitizeAssistantReply(String raw, bool upgradeRequired) {
    if (upgradeRequired) {
      return 'This feature has reached its limit or is currently unavailable on your current account.';
    }
    if (!_sensitiveAssistantTerms.hasMatch(raw)) {
      return raw;
    }

    final keptLines = <String>[];
    for (final line in raw.split('\n')) {
      final trimmed = line.trim();
      if (trimmed.isEmpty) {
        if (keptLines.isNotEmpty && keptLines.last.isNotEmpty) {
          keptLines.add('');
        }
        continue;
      }
      if (!_sensitiveAssistantTerms.hasMatch(trimmed)) {
        keptLines.add(line);
        continue;
      }
      // Keep non-commercial sentences on the same line if present
      final sentences = trimmed.split(RegExp(r'(?<=[.!?])\s+'));
      final cleanSentences = sentences
          .where((s) => s.trim().isNotEmpty && !_sensitiveAssistantTerms.hasMatch(s))
          .toList();
      if (cleanSentences.isNotEmpty) {
        keptLines.add(cleanSentences.join(' '));
      }
    }

    final result = keptLines.join('\n').trim();
    return result.isNotEmpty
        ? result
        : 'I can help you with NGX stock screening, AAOIFI ratios, Zakat, and dividend purification.';
  }

  List<String> _filterFollowups(List<dynamic>? rawFollowups) {
    return (rawFollowups ?? [])
        .map((e) => e.toString())
        .where((q) => !_sensitiveAssistantTerms.hasMatch(q))
        .toList();
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent + 120,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _loadConversations() async {
    setState(() => _isLoadingHistory = true);
    try {
      final list = await _chatService.fetchConversations();
      if (mounted) {
        setState(() => _conversations = list);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not load chat history.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoadingHistory = false);
    }
  }

  Future<void> _selectConversation(int conversationId) async {
    setState(() => _isLoadingHistory = true);
    try {
      final data = await _chatService.fetchConversation(conversationId);
      final rawMsgs = data['messages'] as List<dynamic>? ?? [];
      if (mounted) {
        setState(() {
          _activeConversation = Map<String, dynamic>.from(data['conversation'] as Map);
          _messages = rawMsgs.map((m) => Map<String, dynamic>.from(m as Map)).toList();
          _showingHistory = false;
        });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open conversation.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoadingHistory = false);
    }
  }

  void _startNewChat() {
    setState(() {
      _activeConversation = null;
      _messages = [];
      _showingHistory = false;
    });
  }

  Future<void> _sendMessage([String? customText]) async {
    final text = (customText ?? _inputController.text).trim();
    if (text.isEmpty || _isSending) return;

    if (customText == null) {
      _inputController.clear();
    }

    final tempId = 'temp-${DateTime.now().millisecondsSinceEpoch}';
    final optimistic = <String, dynamic>{
      'id': tempId,
      'role': 'user',
      'content': text,
    };

    setState(() {
      _messages = [..._messages, optimistic];
      _isSending = true;
    });
    _scrollToBottom();

    try {
      final convId = _activeConversation?['id'] as int?;
      final res = await _chatService.sendMessage(text, conversationId: convId);
      final userMsg = Map<String, dynamic>.from(res['user_message'] as Map);
      final assistantMsg = Map<String, dynamic>.from(res['assistant_message'] as Map);
      final conv = Map<String, dynamic>.from(res['conversation'] as Map);

      if (mounted) {
        setState(() {
          _activeConversation = conv;
          _messages = [
            ..._messages.where((m) => m['id'] != tempId),
            userMsg,
            assistantMsg,
          ];
        });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _messages = _messages.where((m) => m['id'] != tempId).toList();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to send message. Please try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  Future<void> _sendFeedback(int messageId, String feedback) async {
    try {
      await _chatService.submitFeedback(messageId, feedback);
      if (mounted) {
        setState(() {
          _messages = _messages.map((m) {
            if (m['id'] == messageId) {
              return {...m, 'feedback': feedback};
            }
            return m;
          }).toList();
        });
      }
    } catch (_) {}
  }

  Future<void> _escalateToSupport() async {
    final convId = _activeConversation?['id'] as int?;
    if (convId == null || _isEscalating || _activeConversation?['status'] == 'escalated') {
      return;
    }

    setState(() => _isEscalating = true);
    try {
      await _chatService.escalateConversation(convId);
      if (mounted) {
        setState(() {
          _activeConversation = {...?_activeConversation, 'status': 'escalated'};
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sent to Irshad Support Team!')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not send to support. Please try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isEscalating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final hasAssistantReply = _messages.any((m) => m['role'] == 'assistant');

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.88,
        decoration: BoxDecoration(
          color: context.bg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Drag handle
            Padding(
              padding: const EdgeInsets.only(top: 10, bottom: 4),
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: context.textMuted.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 12, 12),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: context.divider)),
              ),
              child: Row(
                children: [
                  if (_showingHistory)
                    IconButton(
                      icon: Icon(Icons.arrow_back_rounded, color: context.textDark),
                      onPressed: () => setState(() => _showingHistory = false),
                    )
                  else
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: context.primary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 18),
                    ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _showingHistory ? 'Past Conversations' : 'Irshad Assistant',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: context.textDark,
                          ),
                        ),
                        Text(
                          _showingHistory ? 'Tap a thread to continue' : 'AAOIFI, stocks, Zakat & support',
                          style: TextStyle(fontSize: 11, color: context.textMuted, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  if (!_showingHistory) ...[
                    IconButton(
                      tooltip: 'New chat',
                      icon: Icon(Icons.add_comment_outlined, color: context.textMuted, size: 20),
                      onPressed: _startNewChat,
                    ),
                    IconButton(
                      tooltip: 'History',
                      icon: Icon(Icons.history_rounded, color: context.textMuted, size: 20),
                      onPressed: () {
                        setState(() => _showingHistory = true);
                        _loadConversations();
                      },
                    ),
                  ],
                  IconButton(
                    tooltip: 'Close',
                    icon: Icon(Icons.close_rounded, color: context.textMuted),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Body
            Expanded(
              child: _showingHistory ? _buildHistoryView(context) : _buildMessagesView(context),
            ),

            if (!_showingHistory && _activeConversation?['id'] != null && hasAssistantReply)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: context.bgAlt,
                  border: Border(top: BorderSide(color: context.divider)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (_activeConversation?['status'] == 'escalated')
                      Row(
                        children: [
                          Icon(Icons.check_circle_rounded, color: context.primary, size: 16),
                          const SizedBox(width: 6),
                          Text(
                            'Sent to Irshad Support Team',
                            style: TextStyle(color: context.primary, fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                        ],
                      )
                    else ...[
                      Text('Need a human admin?', style: TextStyle(fontSize: 12, color: context.textMuted)),
                      OutlinedButton.icon(
                        onPressed: _isEscalating ? null : _escalateToSupport,
                        icon: const Icon(Icons.support_agent_rounded, size: 15),
                        label: Text(_isEscalating ? 'Sending...' : 'Send to Support'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          visualDensity: VisualDensity.compact,
                          textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

            if (!_showingHistory)
              Container(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 16),
                decoration: BoxDecoration(
                  color: context.bg,
                  border: Border(top: BorderSide(color: context.divider)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _inputController,
                        enabled: !_isSending,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _sendMessage(),
                        decoration: InputDecoration(
                          hintText: 'Ask a question...',
                          hintStyle: TextStyle(color: context.textMuted, fontSize: 14),
                          filled: true,
                          fillColor: context.bgAlt,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide(color: context.divider),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide(color: context.divider),
                          ),
                        ),
                        style: TextStyle(color: context.textDark, fontSize: 14),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      height: 44,
                      width: 44,
                      child: ElevatedButton(
                        onPressed: _isSending ? null : () => _sendMessage(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: context.primary,
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryView(BuildContext context) {
    if (_isLoadingHistory) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_conversations.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'No past conversations yet. Start asking a question!',
            style: TextStyle(color: context.textMuted, fontSize: 14),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(14),
      itemCount: _conversations.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final conv = _conversations[index];
        final isSelected = conv['id'] == _activeConversation?['id'];
        return InkWell(
          onTap: () => _selectConversation(conv['id'] as int),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isSelected ? context.primary.withValues(alpha: 0.08) : context.bgAlt,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        conv['title']?.toString() ?? 'Conversation',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.textDark),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (conv['status'] == 'escalated')
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: context.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          'Escalated',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: context.primary),
                        ),
                      ),
                  ],
                ),
                if ((conv['preview'] ?? '').toString().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    conv['preview'].toString(),
                    style: TextStyle(fontSize: 12, color: context.textMuted),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMessagesView(BuildContext context) {
    if (_messages.isEmpty) {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: context.bgAlt,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: context.divider),
              ),
              child: Text(
                'As-salamu alaykum! Ask me about any NGX stock’s Shariah compliance, AAOIFI ratios, Hawl & Zakat, dividend purification, or your account.',
                style: TextStyle(fontSize: 13.5, color: context.textDark, height: 1.5),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'QUICK QUESTIONS',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: context.textMuted, letterSpacing: 0.6),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _starterPrompts.map((prompt) {
                return ActionChip(
                  label: Text(prompt, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: context.textDark)),
                  backgroundColor: context.bgAlt,
                  side: BorderSide(color: context.divider),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                  onPressed: () => _sendMessage(prompt),
                );
              }).toList(),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(14),
      itemCount: _messages.length + (_isSending ? 1 : 0),
      itemBuilder: (context, index) {
        if (_isSending && index == _messages.length) {
          return Align(
            alignment: Alignment.centerLeft,
            child: Container(
              margin: const EdgeInsets.only(top: 6),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: context.bgAlt,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: context.divider),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                  const SizedBox(width: 8),
                  Text('Thinking...', style: TextStyle(fontSize: 12.5, color: context.textMuted)),
                ],
              ),
            ),
          );
        }

        final msg = _messages[index];
        final isUser = msg['role'] == 'user';
        final metadata = msg['metadata'] is Map ? Map<String, dynamic>.from(msg['metadata'] as Map) : <String, dynamic>{};
        final citedSymbols = (metadata['cited_symbols'] as List<dynamic>? ?? []).map((e) => e.toString()).toList();
        final followups = _filterFollowups(metadata['suggested_followups'] as List<dynamic>?);
        final upgradeRequired = metadata['upgrade_required'] == true;
        final requiredTier = metadata['required_tier']?.toString();
        final upgradeFeature = metadata['upgrade_feature']?.toString();
        final rawContent = msg['content']?.toString() ?? '';
        final assistantContent = isUser ? rawContent : _sanitizeAssistantReply(rawContent, upgradeRequired);
        final isLastMessage = index == _messages.length - 1;
        final msgId = msg['id'];

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              Container(
                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isUser ? context.primary : context.bgAlt,
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(14),
                    topRight: const Radius.circular(14),
                    bottomLeft: Radius.circular(isUser ? 14 : 4),
                    bottomRight: Radius.circular(isUser ? 4 : 14),
                  ),
                  border: isUser ? null : Border.all(color: context.divider),
                ),
                child: isUser
                    ? Text(
                        msg['content']?.toString() ?? '',
                        style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.45),
                      )
                    : MarkdownBody(
                        data: assistantContent,
                        styleSheet: MarkdownStyleSheet(
                          p: TextStyle(color: context.textDark, fontSize: 13.8, height: 1.45),
                          listBullet: TextStyle(color: context.textDark, fontSize: 13.8),
                          strong: TextStyle(color: context.textDark, fontWeight: FontWeight.w800),
                        ),
                      ),
              ),
              if (!isUser && upgradeRequired) ...[
                const SizedBox(height: 6),
                ActionChip(
                  avatar: const Icon(Icons.info_outline_rounded, size: 15, color: Colors.white),
                  label: const Text(
                    'Account Limit Reached',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                  backgroundColor: context.primary,
                  side: BorderSide.none,
                  visualDensity: VisualDensity.compact,
                  onPressed: () {
                    showModalBottomSheet<void>(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => UpgradePaywallBottomSheet(
                        message: 'This feature has reached its limit on your current account.',
                        requiredTier: requiredTier == 'max' ? 'max' : 'pro',
                        featureKey: upgradeFeature,
                        notifyThreshold: false,
                      ),
                    );
                  },
                ),
              ],
              if (!isUser && citedSymbols.isNotEmpty) ...[
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: citedSymbols.map((sym) {
                    return ActionChip(
                      avatar: Icon(Icons.analytics_outlined, size: 14, color: context.primary),
                      label: Text('View $sym', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: context.primary)),
                      backgroundColor: context.primary.withValues(alpha: 0.1),
                      side: BorderSide.none,
                      visualDensity: VisualDensity.compact,
                      onPressed: () {
                        Navigator.pop(context);
                        StockDetailScreen.openWithLoading(context, {'symbol': sym});
                      },
                    );
                  }).toList(),
                ),
              ],
              if (!isUser && followups.isNotEmpty && isLastMessage) ...[
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: followups.map((q) {
                    return ActionChip(
                      label: Text(q, style: TextStyle(fontSize: 11.5, color: context.textMuted)),
                      backgroundColor: context.bg,
                      side: BorderSide(color: context.divider),
                      visualDensity: VisualDensity.compact,
                      onPressed: () => _sendMessage(q),
                    );
                  }).toList(),
                ),
              ],
              if (!isUser && msgId is int)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: Icon(
                        Icons.thumb_up_alt_outlined,
                        size: 15,
                        color: msg['feedback'] == 'up' ? context.primary : context.textMuted,
                      ),
                      visualDensity: VisualDensity.compact,
                      onPressed: () => _sendFeedback(msgId, 'up'),
                    ),
                    IconButton(
                      icon: Icon(
                        Icons.thumb_down_alt_outlined,
                        size: 15,
                        color: msg['feedback'] == 'down' ? context.haram : context.textMuted,
                      ),
                      visualDensity: VisualDensity.compact,
                      onPressed: () => _sendFeedback(msgId, 'down'),
                    ),
                  ],
                ),
            ],
          ),
        );
      },
    );
  }
}
