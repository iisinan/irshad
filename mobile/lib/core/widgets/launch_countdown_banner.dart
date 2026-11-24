import 'dart:async';
import 'package:flutter/material.dart';
import 'package:irshad_mobile/core/theme/app_theme.dart';

class LaunchCountdownBanner extends StatefulWidget {
  final bool compact;
  final bool dismissible;
  final EdgeInsetsGeometry? margin;

  const LaunchCountdownBanner({
    super.key,
    this.compact = false,
    this.dismissible = false,
    this.margin,
  });

  @override
  State<LaunchCountdownBanner> createState() => _LaunchCountdownBannerState();
}

class _LaunchCountdownBannerState extends State<LaunchCountdownBanner> {
  // December 1st, 2026 00:00:00 WAT (UTC+1) = Nov 30, 2026 23:00:00 UTC
  static final DateTime _launchUtc = DateTime.utc(2026, 11, 30, 23, 0, 0);
  static const Duration _celebrationWindow = Duration(hours: 72);

  Timer? _timer;
  bool _dismissed = false;
  late Duration _remaining;

  @override
  void initState() {
    super.initState();
    _remaining = _launchUtc.difference(DateTime.now().toUtc());
    if (_remaining.inSeconds > -_celebrationWindow.inSeconds) {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (!mounted) return;
        setState(() {
          _remaining = _launchUtc.difference(DateTime.now().toUtc());
        });
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _pad2(int n) => n.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    if (_dismissed) return const SizedBox.shrink();

    final isLive = _remaining.isNegative && _remaining.abs() <= _celebrationWindow;
    final isExpired = _remaining.isNegative && _remaining.abs() > _celebrationWindow;
    if (isExpired) return const SizedBox.shrink();

    final totalSeconds = _remaining.isNegative ? 0 : _remaining.inSeconds;
    final days = totalSeconds ~/ 86400;
    final hours = (totalSeconds % 86400) ~/ 3600;
    final minutes = (totalSeconds % 3600) ~/ 60;
    final seconds = totalSeconds % 60;

    if (widget.compact) {
      return Container(
        margin: widget.margin ?? const EdgeInsets.fromLTRB(20, 4, 20, 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              context.primary.withValues(alpha: 0.1),
              context.questionableBg,
            ],
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: context.primary.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: context.primary,
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.rocket_launch_rounded, size: 11, color: Colors.white),
                  SizedBox(width: 4),
                  Text(
                    'DEC 1',
                    style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.4),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                isLive
                    ? 'Irshad is officially live!'
                    : 'Going Live: ${_pad2(days)}d : ${_pad2(hours)}h : ${_pad2(minutes)}m : ${_pad2(seconds)}s',
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                  color: context.textDark,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (widget.dismissible)
              GestureDetector(
                onTap: () => setState(() => _dismissed = true),
                child: Padding(
                  padding: const EdgeInsets.only(left: 6),
                  child: Icon(Icons.close_rounded, size: 16, color: context.textMuted),
                ),
              ),
          ],
        ),
      );
    }

    return Container(
      margin: widget.margin ?? EdgeInsets.zero,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.bgSection,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: context.questionableBg,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.rocket_launch_rounded, size: 12, color: context.questionable),
                    const SizedBox(width: 5),
                    Text(
                      'GOING LIVE · DEC 1, 2026',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.6,
                        color: context.questionable,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (isLive)
            Text(
              'Irshad Public Launch is Officially Live!',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.primary),
            )
          else
            Row(
              children: [
                _buildUnitBox(context, _pad2(days), 'DAYS', highlight: true),
                _buildColon(context),
                _buildUnitBox(context, _pad2(hours), 'HRS'),
                _buildColon(context),
                _buildUnitBox(context, _pad2(minutes), 'MINS'),
                _buildColon(context),
                _buildUnitBox(context, _pad2(seconds), 'SECS'),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildColon(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Text(
        ':',
        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: context.textMuted),
      ),
    );
  }

  Widget _buildUnitBox(BuildContext context, String value, String label, {bool highlight = false}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: context.bg,
          borderRadius: BorderRadius.circular(11),
          border: Border.all(color: context.divider),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: highlight ? context.primary : context.textDark,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: context.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
