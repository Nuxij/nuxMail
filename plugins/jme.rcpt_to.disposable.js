// jme.rcpt_to.disposable
// Description: This plugin allows dated, auto-expire address aliases.

var Address = require('./address').Address;

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
    connection.logdebug(this, "Email expires on: " + expiry_date);

    var today = new Date();
    if (expiry_date < today) {
        // If we get here, the email address has expired
        connection.logdebug(this, "Email expired!");
        return next(DENY, "Expired email address");
    }

    // now get rid of the extension:
    var newRcpt = match[1] + "@" + host;
    connection.loginfo(this, "Aliasing dated email: " + newRcpt);
    connection.transaction.rcpt_to.pop();
    connection.transaction.rcpt_to.push(new Address('<' + newRcpt + '>'));

    next();
};
