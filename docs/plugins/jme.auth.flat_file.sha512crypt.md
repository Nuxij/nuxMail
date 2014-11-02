jme.auth.flat_file_sha512crypt
========

This plugin provides flat-file user authentication as per the default auth/flat_file
plugin, but stores SHA512-CRYPT password hashes, instead of cleartext passwords.
This allows better security for multi-user configurations as well as some protection
against intruders to the system or poor permissions in general.

Configuration
-------------

* `config/jme.mailbox_accounts`

    Configuration is a JSON formatted file, an object with two members as so:

    ```{
    		"authMethod": "file",
    		"accounts": {}
    	}```

    * **File auth method**

    	The `accounts` member is an object with keys for each domain that users belong to,
    	each of which has an object value with usernames (before the @)	for keys. Users must
    	therefore authenticate using 'user@example.com' usernames, rather than simply 'user'.
    	This has the added benefit of allowing users to have the same name across domains -
    	(e.g. 'joe@example.com' and 'joe@otherdomain.com' can be separate).

	    ```"accounts": {
	    		"example.com": {
	    			"joe": {}
	    		}
	    	}```

	    Each username key has an object value with the following structure:

	    ```"joe": {
				"password": "<HASH HERE>"
			}```

		This should be pretty obvious. The 'password' member has a string value
		containing the hash of the password.

	* **Notes**

		The SHA512-CRYPT format allows specifying the round count within the hash, but this
		plugin cirrently does not. It relies on the standard default of 5000 rounds. Custom round
		configuration will be added in the future.

		This plugin shares it's configuration file with other ```jme.*``` plugins. They are able to
		co-exist peacefully, so just slot in your password fields without worry.

Example Configuration
-------------
{
	"authMethod": "file",
	"accounts": {
		"example.com": {
			"joe": {
				"password": "$6$NxDU4c7AM3Wq2TOQ$f1x4okV0B2BOYjmkuIwzYaik3M0BJIqcFdIDrL8WIAz0gsjfuOuUWbOyjX7m85.0JVJSUA2ilHJ5bVzRrv45O0"
			}
		},
		"otherdomain.com": {
			"tom": {
				"password": "$6$nlo7ZSJZSnruXJhJ$OX6wQi9gmlLdOQtRYdMIesCzvxuGrL5ZMY6Ummx0miW/TXkzABpODsTKeyFeGKyuAq6XqiXcrpDSvYilon5Ph/"
			}
		}
	}
}
