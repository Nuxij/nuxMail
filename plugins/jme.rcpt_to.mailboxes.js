// jme.rcpt_to.mailboxes
// Description: Requires recipients to exist in a config file.

var loadConfig = function(plugin, connection) {
	var config		= plugin.config.get('jme.mailbox_accounts', 'json') || {};
	var returnValue = false;

	var authMethod = config['authMethod'] || "file";
	if (authMethod == "file") {
		connection.logdebug(plugin, "Using file-auth");
		if (config['accounts']) {
			returnValue = config['accounts'];
		} else {
			connection.logdebug(plugin, "Error! No accounts table in config file!");
		}
	}
	return returnValue;
};

var hostInConfig = function(plugin, connection, config, host) {
	if (config[host]) {
		return true;
	} else {
		connection.logdebug(plugin, "Host " + host + " not local (no forwarding)");
		return false;
	}
};

var checkValidMailbox = function(next, connection, params) {
	var rcpt        = params[0];
	var address     = rcpt.address();
	// We don't do any '-' matchng on this address
	// It *must* be already be stripped before it gets here
	var user        = rcpt.user;
	var host        = rcpt.host;
	var config		= loadConfig(this, connection);
	var returnValue;

	if(config && !connection.transaction.notes.pipe) {
		if(hostInConfig(this, connection, config, host)) {
			config = config[host];
			connection.loginfo(this, "Checking account for: " + address);

			if (config[user]) {
				connection.logdebug(this, "User " + address + " exists");
			} else {
				// Maybe we should bounce instead?
				connection.logdebug(this, "User " + address + " does not exist");
				returnValue = "User does not exist!";
			}
		} else if (connection.remote_ip == connection.local_ip) {
			connection.relaying = true;
			connection.logdebug(this, "Forwarding allowed for " +
				connection.remote_ip + " (to " + address + ")");
		} else {
			returnValue = "Forwarding not enabled for " + host;
		}
	} else {
		connection.transaction.notes.discard = true;
	}

	if(returnValue) {
		return next(DENY, returnValue);
	} else {
		return next(OK);
	}
};

exports.hook_rcpt = checkValidMailbox;
