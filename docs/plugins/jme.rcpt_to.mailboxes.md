jme.rcpt_to.accounts
========

This plugin allows you to specify exactly which user mailboxes you will accept mail for.
Because it manages users per domain, it has the benefit of managing which domains
you accept mail to as well, so it should replace "rcpt_to.in_host_list" as the final plugin
before the queue. They **DO NOT** work together.

There is no wildcard matching for the accounts, other plugins must catch
aliases/wildcards for you before the email gets here.

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

	    As you can see, each username key has an object value as well. This is because the
	    configuration is shared between this plugin and ```jme.queue_outbound.accounts```,
	    which requires some extra fields per username. For now though, you may just leave it empty.

Example Configuration
-------------
{
	"authMethod": "file",
	"accounts": {
		"example.com": {
			"joe": {},
			"terry": {}
		},
		"otherdomain.com": {
			"tom": {}
		}
	}
}
