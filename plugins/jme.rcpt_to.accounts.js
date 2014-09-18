// jme.rcpt_to.accounts
// Description: Requires recipients to exist in a config file.
// Author: Joe Eaves

exports.hook_rcpt = function(next, connection, params) {
	var config      = this.config.get('accounts', 'json') || {};
	var rcpt        = params[0];
	var address     = rcpt.address();
	// We don't do any '-' matchng on this address
	// It *must* be already be stripped before it gets here
	var user        = rcpt.user;
	var host        = rcpt.host;
	var accountList = [];

	connection.loginfo(this, "Checking account for: " + address);
	// Where should we look for our accounts?
	var authMethod = config['authMethod'] || "file";
	if (authMethod == "file") {
		connection.logdebug(this, "Using file-auth");
		// Get our account list
		if (config['accounts']) {
			if (config['accounts'][host]) {
				accountList = config['accounts'][host];
			} else {
				connection.logdebug(this, "Host " + host + " not local (no forwarding)");
				return next(DENYDISCONNECT, "Forwarding not enabled for " + host);
			}
		} else {
			connection.logdebug(this, "Error! No accounts table in config file!");
		}
	}

	if (accountList.indexOf(user) !== -1) {
		// This will stop other hook_rcpt function running
		// Are we sure?
		connection.logdebug(this, "User " + address + " exists");
		return next(OK);
	} else {
		// Should we bounce or not?
		connection.logdebug(this, "User " + address + " does not exist");
		return next(DENY, "User does not exist!");
	}
};
