jme.queue_outbound.accounts
========

This plugin provides user authorisation for MAIL_FROM addresses,
an authenticated user can only send from addresses that are listed in the cnfiguration.
This works well in conjunction with rcpt_to alias plugins to ensure
that users can only send email from the aliases that redirect to them,
rather than any address they like.

Configuration
-------------

* `config/jme.mailbox_accounts`

    Configuration is a JSON formatted file, an object with two members as so:

    ```{
    		"authMethod": "file",
    		"accounts": {}
    	}```

    * **File auth method**

    	The `accounts` member is an object with keys for each domain you accept
    	email for, each of which has an object value with usernames (before the @)
    	for keys.

	    ```"accounts": {
	    		"example.com": {
	    			"joe": {}
	    		}
	    	}```

	    Each username key has an object value with the following structure:

	    ```"joe": {
				"sendFrom": ["jinux","jme"]
			}```

		This should be pretty obvious. The 'sendFrom' member has an array value,
		that contains strings of all the usernames that the user is allowed to
		send from.

		You may specify a user to send from that lives at another domain, simple
		by writing their full address instead of just the username, as so:

		```"joe": {
				"sendFrom": ["jinux","jme@otherdomain.com"]
			}```

		If you don't want to allow a user to send from any other address than their own,
		just leave the 'sendFrom' list empty ([]).

Example Configuration
-------------
{
	"authMethod": "file",
	"accounts": {
		"example.com": {
			"joe": {
				"sendFrom": ["jinux", "jme@otherdomain.com"]
			},
			"terry": {
				"sendFrom": []
			}
		},
		"otherdomain.com": {
			"tom": {
				"sendFrom": ["tommy"]
			}
		}
	}
}
