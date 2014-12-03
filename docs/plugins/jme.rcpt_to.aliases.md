jme.rcpt_to.aliases
========

This is a simple aliases plugin that allows chaining.
Aliases allow a single wildcard character '+', to fall
in line with standard user-delimiter practice.

* Note: The 'official' aliases plugin has a warning about using it with the 'queue/smtp\_proxy' plugin.
    I haven't tested this plugin with that one, so lets assume it doesn't work either.

Configuration
-------------

* `config/jme.rcpt_to.aliases`

    Configuration is a JSON formatted file, an object with two members as so:

    ```{
    		"authMethod": "file",
    		"aliases": {}
    	}```

    * **Chaining**

        Because we allow chaining, we're susceptible to cyclic aliases. There is small protection
        to stop you going from A->B->A, but we can't track cycles of longer than that. Avoiding
        these chains so that the plugin and server work correctly is ***down to you***.

    * **File auth method**

        The `aliases` member is an object with keys for each domain you want an alias for,
        each of which has an object value listing the aliases for that domain. Each alias
        should be in the form

        ```"aliasFrom": "aliasTo"```

        using only the first part of each email (before the @) for same-domain aliases.

        To cross domains, simply use the full address in the ```aliasTo``` field

        ```"aliasFrom": "aliasTo@domain.com"```.

Example Configuration
-------------
{
	"authMethod": "file",
	"aliases": {
		"example.com": {
            "jinux": "joe",
			"tommy": "tommy@otherdomain.com"
		},
		"otherdomain.com": {
			"tommy": "tom",
			"jme": "joe@example.com"
		}
	}
}
