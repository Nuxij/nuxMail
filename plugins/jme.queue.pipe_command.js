// jme.queue.pipe_command.js

var ChildProcess = require('child_process');

var ExternalCommand = function(command, args, inputStream, exitFunction) {
        var instance = this;
        if (command === null) {
                return next();
        }
        var child = ChildProcess.spawn(command, args);
        instance.exit = 0;
        child.on('exit', function (code, signal) { exitFunction(code, signal, instance); });
        inputStream.pipe(child.stdin, {dot_stuffing: true, ending_dot: true});
};

exports.hook_queue = function (next, connection) {
        var instance = this;
        var msg_stream = connection.transaction.message_stream;
        var notes = connection.transaction.notes;

        if(!notes.pipe) {
                next();
        }
        notes.discard = true;
        connection.loginfo(this, "Piping to external command: " + notes.pipeCommand);

        connection.transaction.add_leading_header('Return-Path', connection.transaction.mail_from.address());
        connection.transaction.add_leading_header('Envelope-To', connection.transaction.rcpt_to[0]);

        var pipedCommand = new ExternalCommand(
                notes.pipeCommand, notes.pipeArgs, msg_stream,
                function (code, signal, commandInstance) {
                        commandInstance.exit = 1;
                        connection.logdebug(instance, "Command complete: " + code + " " + signal);
                        next();
                }
        );
};
