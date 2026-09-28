import re

content = open('backend/app/Http/Controllers/SuggestionController.php').read()

OLD_REPLY = """        \\Illuminate\\Support\\Facades\\Mail::raw(
            "Hello {$user->name},\\n\\nThank you for your suggestion:\\n\\"{$suggestion->message}\\"\\n\\nResponse from Irshad Admin:\\n{$replyMessage}\\n\\nThanks,\\nThe Irshad Team",
            function ($message) use ($user) {
                $message->to($user->email)->subject('Re: Your Suggestion for Irshad');
            }
        );

        $suggestion->update(['status' => 'read']);"""

NEW_REPLY = """        \\Illuminate\\Support\\Facades\\Mail::raw(
            "Hello {$user->name},\\n\\nThank you for your suggestion:\\n\\"{$suggestion->message}\\"\\n\\nResponse from Irshad Admin:\\n{$replyMessage}\\n\\nThanks,\\nThe Irshad Team",
            function ($message) use ($user) {
                $message->to($user->email)->subject('Re: Your Suggestion for Irshad');
            }
        );

        // Store the admin reply as a chat message
        Suggestion::create([
            'user_id' => $user->id,
            'message' => $replyMessage,
            'is_admin_reply' => true,
            'status' => 'read'
        ]);

        $suggestion->update(['status' => 'read']);"""

if OLD_REPLY in content:
    content = content.replace(OLD_REPLY, NEW_REPLY)
    open('backend/app/Http/Controllers/SuggestionController.php', 'w').write(content)
    print("Patched SuggestionController (reply)")
else:
    print("Could not find reply code block in controller")

# Now update `index` to group by user, returning the most recent interactions
OLD_INDEX = """    public function index(): JsonResponse
    {
        $suggestions = Suggestion::with('user:id,name,email')->orderBy('created_at', 'desc')->paginate(20);
        
        return response()->json([
            'data' => $suggestions->items(),
            'pagination' => [
                'current_page' => $suggestions->currentPage(),
                'last_page' => $suggestions->lastPage(),
                'total' => $suggestions->total(),
            ]
        ]);
    }"""

NEW_INDEX = """    public function index(): JsonResponse
    {
        // Fetch all suggestions, sorted by oldest first so that they appear sequentially in chat
        $allSuggestions = Suggestion::with('user:id,name,email')
            ->orderBy('created_at', 'asc')
            ->get();
            
        // Group them by user_id
        $grouped = $allSuggestions->groupBy('user_id');
        
        // Format into a list of conversations
        $conversations = [];
        
        foreach ($grouped as $userId => $userSuggestions) {
            $user = $userSuggestions->first()->user;
            
            // Only include conversations where the user exists
            if (!$user) continue;

            $hasUnread = $userSuggestions->where('status', 'unread')->where('is_admin_reply', false)->count() > 0;
            $lastInteraction = $userSuggestions->last()->created_at;

            $conversations[] = [
                'user' => $user,
                'has_unread' => $hasUnread,
                'last_interaction' => $lastInteraction,
                'messages' => $userSuggestions->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'message' => $s->message,
                        'status' => $s->status,
                        'is_admin_reply' => (bool)$s->is_admin_reply,
                        'created_at' => $s->created_at
                    ];
                })->values()
            ];
        }

        // Sort conversations by last interaction (newest first)
        usort($conversations, function ($a, $b) {
            return $b['last_interaction'] <=> $a['last_interaction'];
        });
        
        return response()->json([
            'data' => $conversations
        ]);
    }"""

if OLD_INDEX in content:
    content = content.replace(OLD_INDEX, NEW_INDEX)
    open('backend/app/Http/Controllers/SuggestionController.php', 'w').write(content)
    print("Patched SuggestionController (index)")
else:
    print("Could not find index code block in controller")
