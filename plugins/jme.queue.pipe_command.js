// jme.queue.pipe_command.js

var childProcess = require('child_process');

var externalCommand = function(command, args, inputStream, exitFunction) {
        var instance = this;
        if (command !== null) {
                var child = childProcess.spawn(command, args);
                instance.exit = 0;  // Send a cb to set 1 when command exits
                child.on('exit', function (code, signal) { exitFunction(code, signal, instance); });
                inputStream.pipe(child.stdin, {});
        }
};

exports.hook_queue = function (next, connection) {
        var instance = this;
        var msg_stream = connection.transaction.message_stream;
        var notes = connection.transaction.notes;

        if(notes.pipe === true) {
                notes.discard = true;
                connection.loginfo(this, "Piping to external command: " + notes.pipeCommand);
                var pipedCommand = new externalCommand(
                        notes.pipeCommand, notes.pipArgs, msg_stream,
                        function (code, signal, commandInstance) {
                                commandInstance.exit = 1;
                                connection.logdebug(instance, "Command complete: " + code + " " + signal);
                                next();
                        }.bind(this)
                );
        }
};
