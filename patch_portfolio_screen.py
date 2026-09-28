import os

filepath = 'mobile/lib/features/portfolio/ui/portfolio_screen.dart'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Add TickerProviderStateMixin and _tabController
old_class_def = "class _PortfolioScreenState extends State<PortfolioScreen> with WidgetsBindingObserver {"
new_class_def = "class _PortfolioScreenState extends State<PortfolioScreen> with WidgetsBindingObserver, TickerProviderStateMixin {\n  late TabController _tabController;\n  int _currentIndex = 0;"
content = content.replace(old_class_def, new_class_def)

# 2. Initialize _tabController in initState
old_init_state = """  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);"""
new_init_state = """  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging || _tabController.index != _currentIndex) {
        setState(() => _currentIndex = _tabController.index);
      }
    });
    WidgetsBinding.instance.addObserver(this);"""
content = content.replace(old_init_state, new_init_state)

# 3. Dispose _tabController
old_dispose = """  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }"""
new_dispose = """  @override
  void dispose() {
    _tabController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }"""
content = content.replace(old_dispose, new_dispose)

# 4. Use _tabController instead of DefaultTabController
# Note: Since it's a Scaffold, we don't strictly need DefaultTabController if we provide controller directly to TabBar and TabBarView.
old_build_start = """  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold("""
new_build_start = """  @override
  Widget build(BuildContext context) {
    return Scaffold("""
content = content.replace(old_build_start, new_build_start)

# Remove the extra `)` at the end of the Scaffold return from DefaultTabController
# In portfolio_screen.dart, it ends with:
#         ),
#       ),
#     );
#   }
# Let's replace the ending precisely.
old_end = """        floatingActionButton: Padding(
          padding: const EdgeInsets.only(bottom: 88.0),
          child: FloatingActionButton.extended(
            onPressed: () => SuggestModalUtil.show(context),
            backgroundColor: context.primary,
            elevation: 4,
            icon: const Icon(Icons.mail_outline_rounded, color: Colors.white, size: 20),
            label: const Text('Suggest for Irshad', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
    );
  }
}"""
new_end = """        floatingActionButton: _currentIndex == 1 ? null : Padding(
          padding: const EdgeInsets.only(bottom: 88.0),
          child: FloatingActionButton.extended(
            onPressed: () => SuggestModalUtil.show(context),
            backgroundColor: context.primary,
            elevation: 4,
            icon: const Icon(Icons.mail_outline_rounded, color: Colors.white, size: 20),
            label: const Text('Suggest for Irshad', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
    );
  }
}"""
content = content.replace(old_end, new_end)

# Also need to attach the controller to TabBar and TabBarView
# Find TabBar
old_tabbar = """          bottom: TabBar(
            isScrollable: true,"""
new_tabbar = """          bottom: TabBar(
            controller: _tabController,
            isScrollable: true,"""
content = content.replace(old_tabbar, new_tabbar)

# Find TabBarView
old_tabview = """        body: const TabBarView(
          children: ["""
new_tabview = """        body: TabBarView(
          controller: _tabController,
          children: const ["""
content = content.replace(old_tabview, new_tabview)


with open(filepath, 'w') as f:
    f.write(content)
