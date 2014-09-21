// jme.rcpt_to.aliases
// Description: Allows arbitrary aliases for addresses
var Address = require('./address').Address;

function addAddressToTransaction(connection, address) {
	connection.transaction.rcpt_to.pop();
	connection.transaction.rcpt_to.push(new Address('<' + address + '>'));
}

function setParams(params, address) {
	params[0].user = address.split("@", 2)[0];
	params[0].host = address.split("@", 2)[1];
}

function getAliases(plugin, connection, config) {
	var authMethod = config['authMethod'] || "file";
	var aliases = false;
	if (authMethod == "file") {
		connection.logdebug(this, "Using file-auth");
		if (config['aliases']) {
			aliases = config['aliases'];
		} else {
			connection.logdebug(plugin, "No aliases table in config file");
		}
	}
	return aliases;
}

function resolveAlias(plugin, connection, user, host, config) {
	var aliasTo;
	var localAliases = config[host];
	var bottomAddress = user + "@" + host;
	if (localAliases && localAliases[user]) {
		if (bottomAddress == localAliases[user]) {
			connection.logdebug(plugin, "Cyclic alias found, stopping here: " + bottomAddress);
		} else {
			aliasTo = localAliases[user].split("@", 2);
			user = aliasTo[0];
			if (aliasTo[1]) {
				host = aliasTo[1];
			}
			bottomAddress = resolveAlias(plugin, connection, user, host, config);
		}
	}
	return bottomAddress;
}

exports.hook_rcpt = function(next, connection, params) {
	var config      = this.config.get('jme.rcpt_to.aliases', 'json') || {};
	var rcpt        = params[0];
	var address     = rcpt.address();
	var user        = rcpt.user;
	var host        = rcpt.host;

	connection.loginfo(this, "Checking aliases for: " + address);
	var addressBefore = user + "@" + host;
	var aliases = getAliases(this, connection, config);
	var addressAfter = resolveAlias(this, connection, user, host, aliases);

	if (addressBefore == addressAfter) {
		connection.logdebug(this, "Found no aliases for: " + addressBefore);
	} else {
		connection.logdebug(this, addressBefore + " aliases to " + addressAfter);
		setParams(params, addressAfter);
		addAddressToTransaction(connection, addressAfter);
	}
	return next();
};
