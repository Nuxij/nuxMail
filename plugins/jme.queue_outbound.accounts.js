// jme.queue_outbound.accounts
// Description: Requires recipients to exist in a config file.

var checkAccountHash = function(plugin, connection, authHost) {
	var config      = plugin.config.get('jme.mailbox_accounts', 'json') || {};
	var authMethod  = config['authMethod'] || "file";
	var returnValue = {};

	if (authMethod == "file") {
		connection.logdebug(plugin, "Using file-auth");
		if (config['accounts']) {
			if (config['accounts'][authHost]) {
				returnValue = config['accounts'][authHost];
			} else {
				connection.logdebug(plugin, "No users configured for host: " + authHost);
				returnValue = {
					'err': DENY,
					'message': "This server does not handle mail for: " + authHost
				};
			}
		} else {
			connection.logdebug(plugin, "Error! No accounts table in config file!");
		}
	}

	return returnValue;
};

var isUserAuthorised = function(plugin, connection, accountHash, fromUser, authUser, address) {
	if (accountHash[authUser] &&
		(fromUser == authUser ||
			accountHash[authUser]['sendFrom'].indexOf(fromUser) != -1 ||
			accountHash[authUser]['sendFrom'].indexOf(address) != -1
		)
	) {
		connection.logdebug(plugin, "Sender is authorised to send from address: " + address);
		return true;
	} else {
		connection.logdebug(plugin, "Sender is not authorised to send from address: " + address);
		return false;
	}
};

exports.checkAuthorisation = function(next, connection) {
	var from        = connection.transaction.mail_from;
	var address     = from.address();
	var fromUser    = from.user;
	var fromHost    = from.host;
	var authLogin   = connection.notes.auth_user;
	var authUser	= authLogin.split("@")[0];
	var authHost	= authLogin.split("@")[1];

	connection.loginfo(this, "Checking authorisation for: " + authLogin + " as " + address);

	if (!authHost) {
		connection.logdebug(this, "User authenticated with no domain part, rejecting email");
		return (DENY, "No domain part in username, please talk to your administrator.");
	}

	var accountHash = checkAccountHash(plugin, connection, authHost);

	if (accountHash['err']) {
		return next(accountHash['err'], accountHash['message']);
	}

	if (isUserAuthorised(plugin, connection, accountHash, fromUser, authUser, address)) {
		return next();
	} else {
		return next(DENY, "You are not authorised to send from: " + address);
	}
};

exports.register = function() {
	this.register_hook('queue_outbound', 'checkAuthorisation');
};