// jme.queue_outbound.accounts
// Description: Requires recipients to exist in a config file.

exports.checkAuthorisation = function(next, connection) {
	var config      = this.config.get('jme.mailbox_accounts', 'json') || {};
	var from        = connection.transaction.mail_from;
	var address     = from.address();
	var user        = from.user;
	var host        = from.host;
	var authUser	= connection.notes.auth_user;
	var accountHash = {};

	connection.loginfo(this, "Checking account for: " + authUser);
	var authMethod = config['authMethod'] || "file";
	if (authMethod == "file") {
		connection.logdebug(this, "Using file-auth");
		if (config['accounts']) {
			if (config['accounts'][host]) {
				accountHash = config['accounts'][host];
			} else {
				connection.logdebug(this, "No users configured for host: " + host);
				return next(DENY, "This server does not handle mail for: " + host);
			}
		} else {
			connection.logdebug(this, "Error! No accounts table in config file!");
		}
	}

	if (accountHash[authUser]) {
		if(accountHash[authUser]['sendFrom'].indexOf(user) != -1 || user == authUser) {
			connection.logdebug(this, "Sender is authorised for address " + address);
			return next();
		} else {
			connection.logdebug(this, "Sender is not authorised to send from address: " + address);
			return next(DENY, "You are not authorised to send from address: " + address);
		}
	} else {
		connection.logdebug(this, "Sender is not authorised to send from address: " + address);
		return next(DENY, "You are not authorised to send from address: " + address);
	}
};

exports.register = function() {
	this.register_hook('queue_outbound', 'checkAuthorisation');
};