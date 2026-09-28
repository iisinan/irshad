content = open('backend/app/Http/Controllers/SuggestionController.php').read()

BAD_CODE = '''            "Hello {$user->name},

Thank you for your suggestion:
"{$suggestion->message}"

Response from Irshad Admin:
{$replyMessage}

Thanks,
The Irshad Team",'''

GOOD_CODE = '''            "Hello {$user->name},\\n\\nThank you for your suggestion:\\n\\"{$suggestion->message}\\"\\n\\nResponse from Irshad Admin:\\n{$replyMessage}\\n\\nThanks,\\nThe Irshad Team",'''

content = content.replace(BAD_CODE, GOOD_CODE)
open('backend/app/Http/Controllers/SuggestionController.php', 'w').write(content)
