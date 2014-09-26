nuxMail
-----

In here be some plugins (and docs :D) I've written to run my mail server. Submit an issue if you see one!

## Plugins

### Inbound

	* jme.rcpt_to.aliases

		* "This is a simple aliases plugin that allows chaining."

	* jme.rcpt_to.disposable

		* This is the plugin from the haraka plugin tutorial. A nice idea so I kept it.

	* jme.rcpt_to.mailboxes

		* This plugin allows you to specify exactly which user mailboxes you will accept mail for.

			Because it manages users per domain, it has the benefit of managing which domains
			you accept mail to as well, so it should replace "rcpt_to.in_host_list" as the final plugin
			before the queue. They **DO NOT** work together.

			This plugin is redundant if you push your mail directly to something like an IMAP server, since that will manage your users for you, but it's useful if you want to direct to, say, a ~/Maildir structure directly.

### Outbound

	* jme.queue_outbound.accounts

		* This plugin provides user authorisation for MAIL_FROM addresses.

			An authenticated user can only send from addresses that are listed in the configuration.
			This works well in conjunction with rcpt_to alias plugins to ensure that users can only
			send email from the aliases that redirect to them, rather than any address they like.
