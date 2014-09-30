jme.queue_outbound.accounts
========

This plugin provides user authorisation for MAIL_FROM addresses.
An authenticated user can only send from addresses that are listed in the configuration.
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

	* **Notes**

		At the moment there is one thing worth noting. This plugin needs your users to auth
		using 'user@domain.com' usernames. If users authenticate with no domain part in their
		name, we can't tell who they are supposed to be, so we can't chech authorisation.

		We use 'fail closed' logic that stops users potentially being able to send as others by
		using the username domain part or nothing at all.
		We could potentially use the domain part of the MAIL_FROM header, but then 'tom@dev.com'
		would be allowed to send as 'tom@otherdomain.com' if the latter existed without any
		explicit permission. Not good!

		Essentially, if you don't use 'user@domain.com' authentication, your users won't be able
		to send email.

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
