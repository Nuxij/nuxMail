jme.queue.pipe_command
========

This plugin allows piping of emails to external commands.
It works in conjunction with `jme.rcpt_to.aliases` to allow you to point all emails for an alias
out to any arbitrary command, via it's stdin file descriptor.

* Note: Because any pipe aliases don't have real mailboxes behind them, it will mark all emails
    it handles for discardment. This means that although it is a 'queue' plugin, you should put
    it *before* the `discard` plugin in your 'config/plugins' file, not after.

Configuration
-------------

* `config/jme.rcpt_to.aliases`

    Configuration is done via the aliases file, which at the base looks like so:

    ```{
    		"authMethod": "file",
    		"aliases": {}
    	}```


    * **File auth method**

        The `aliases` member is an object with keys for each domain you want an alias for,
        each of which has an object value listing the aliases for that domain. To pipe an alias
        to an external command, you need to write an array value as so:

        ```"aliasFrom": ["|", "/bin/command", ["arg1", "arg2"]]```

        As you can see, the first member of the array is a literal 'pipe' character, this tells us
        how to deal with the emails for this alias. The second member is the path to the command
        and the third is an array containing all the arguments we want to pass the command.

        This is designed to be similar to the way Exim's 'pipe' transport syntax looks:

        ```alias_user: "|/bin/command arg1 arg2"```

        *Note*: The command is run using the same user that is running Haraka. Please **don't use root**
        for this!

    * **Alternative alias plugins**

    	Although I have written the above as dependent on my `jme.rcpt_to.aliases` plugin, in fact you can
    	use any alias plugin you like. All that this plugin requires is the following variables:

    	* 'connection.transaction.notes.pipe' - If this is true, we want to pipe the email.

    	* 'connection.transaction.notes.pipeCommand' - The command we want to call.

    	* 'connection.transaction.notes.pipeArgs' - Any args we want to pass the command.

    	How those variables get set is up to you :)

Example Configuration
-------------
{
	"authMethod": "file",
	"aliases": {
		"example.com": {
            "jinux": "joe",
			"tommy": ["|", "/home/tommy/email_store.sh", []]
		}
	}
}
