// jme.auth.flat_file_sha512-crypt.js

var sha512 = require('sha512crypt-node');

exports.register = function () {
	var plugin = this;
	plugin.inherits('auth/auth_base');
	var load_config = function () {
		plugin.cfg = plugin.config.get('jme.mailbox_accounts', 'json') || {};
	};
	load_config();
};

exports.hook_capabilities = function (next, connection) {
	var plugin = this;
	// don't allow AUTH unless private IP or encrypted
	if (!connection.using_tls) {
		connection.logdebug(plugin, "Auth disabled for insecure public connection");
		return next();
	}

	var methods = ['PLAIN', 'LOGIN'];

	connection.capabilities.push('AUTH ' + methods.join(' '));
	connection.notes.allowed_auth_methods = methods;

	next();
};

exports.retrieveUser = function (connection, user, cb) {
	var plugin = this;
	var username = user.split('@')[0];
	var domain = user.split('@')[1] || '';
	connection.loginfo(plugin, "Checking password for " + user);
	if (plugin.cfg.accounts[domain]) {
		if (plugin.cfg.accounts[domain][username]) {
			return cb(plugin.cfg.accounts[domain][username].password);
		}
	}
	return cb(null);
};

exports.validateHash = function(hash, password) {
	// Need to add support for round specification here
	var salt = hash.match(/^\$6\$(.*)\$/)[1];
	var validHash = sha512.b64_sha512crypt(password, salt);
	if (validHash === hash) return true;
	return false;
};

exports.check_plain_passwd = function (connection, user, password, cb) {
	var instance = this;
	this.retrieveUser(connection, user, function (hash) {
		if (hash === null) {
			return cb(false);
		}

		var validHash = instance.validateHash(hash, password);
		return cb(validHash);
	});
};
