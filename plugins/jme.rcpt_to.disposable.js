// jme.rcpt_to.disposable

// documentation via: haraka -c /Users/jme/Dropbox/code/nuxMail -h plugins/jme.rcpt_to.disposable

// Put your plugin code here
// type: `haraka -h Plugins` for documentation on how to create a plugin

exports.hook_rcpt = function(next, connection, params) {
    var rcpt     = params[0];
    var address  = rcpt.address();
    var user     = rcpt.user;
    var host     = rcpt.host;

    connection.loginfo(this, "Got recipient: " + rcpt);

    // Check user matches regex 'user-YYYYMMDD':
    var match = /^(.*)-(\d{4})(\d{2})(\d{2})$/.exec(user);
    if (!match) {
        return next();
    }

    // get date - note Date constructor takes month-1 (i.e. Dec == 11).
    var expiry_date = new Date(match[2], match[3]-1, match[4]);
    connection.loginfo(this, "Email expires on: " + expiry_date);

    var today = new Date();
    if (expiry_date < today) {
        // If we get here, the email address has expired
        connection.logdebug(this, "Email expired!");
        return next(DENY, "Expired email address");
    }
    var newRcpt = match[1] + "@" + host;

    // now get rid of the extension:
    connection.logdebug(this, "Aliasing dated email: " + newRcpt);
    connection.transaction.rcpt_to.pop();
    connection.transaction.rcpt_to.push(new Address('<' + newRcpt + '>'));

    next();
};
