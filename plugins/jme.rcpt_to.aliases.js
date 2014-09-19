// jme.rcpt_to.aliases
// Description: Allows arbitrary aliases for addresses
var Address = require('./address').Address;

function _getAliases(plugin, connection, host, config) {
	// Where should we look for our accounts?
	var authMethod = config['authMethod'] || "file";
	if (authMethod == "file") {
		// Get our account list
		if (config['aliases']) {
			if (config['aliases'][host]) {
				// We found our host in the list
				return config['aliases'][host];
			} else {
				connection.logdebug(plugin, "Host " + host + " has no aliases configured");
				return false;
			}
		} else {
			// This shouldn't happen but it might
			connection.logdebug(plugin, "No aliases table in config file");
			return false;
		}
	}
}

function _resolveAlias(plugin, connection, user, host, config) {
	// Get the aliases for the given host
	var localAliases = _getAliases(plugin, connection, host, config);
	var userTo = user,
		addressTo = host,
		bottomAddress = user + "@" + host;
	if (localAliases && localAliases[user]) {
		// Out alias will either be ['name'] or ['name', 'host']
		var wholeAliasTo = localAliases[user].split("@", 2);
		userTo = wholeAliasTo[0];
		if (wholeAliasTo[1]) {
			addressTo = wholeAliasTo[1];
		}
		// Resolve the new alias we found.
		bottomAddress = _resolveAlias(plugin, connection, userTo, addressTo, config);
	}
	return bottomAddress;
}

exports.hook_rcpt = function(next, connection, params) {
	var config      = this.config.get('jme.rcpt_to.aliases', 'json') || {};
	var rcpt        = params[0];
	var address     = rcpt.address();
	// We don't do any '-' matching on this address
	var user        = rcpt.user;
	var host        = rcpt.host;

	connection.loginfo(this, "Checking aliases for: " + address);
	var addressBefore = user + "@" + host;
	var addressAfter = _resolveAlias(this, connection, user, host, config);

	if (addressBefore == addressAfter) {
		// No aliases happened
		connection.logdebug(this, "Found no aliases for: " + addressBefore);
		return next();
	} else {
		// Successful alias
		connection.logdebug(this, addressBefore + " aliases to " + addressAfter);
		params[0].user = addressAfter.split("@", 2)[0];
		params[0].host = addressAfter.split("@", 2)[1];
		// Stick it back on the 'true' array, not just the params
		connection.transaction.rcpt_to.pop();
		connection.transaction.rcpt_to.push(new Address('<' + addressAfter + '>'));
	}
	return next();
};
