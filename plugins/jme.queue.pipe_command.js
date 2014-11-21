// jme.queue.pipe_command.js

var ChildProcess = require('child_process');
var Readable = require('stream').Readable;

var ExternalCommand = function(command, args, headers, inputStream, exitFunction) {
	var instance = this;
	if (command === null) {
		return next();
	}
	var child = ChildProcess.spawn(command, args);
	instance.exit = 0;
	child.on('exit', function (code, signal) { exitFunction(code, signal, instance); });
	child.stdin.write(headers.join("\n") + "\n");
	inputStream.pipe(child.stdin, {dot_stuffing: true, ending_dot: true});
};

exports.hook_queue = function (next, connection) {
	var instance = this;
	var msg_stream = connection.transaction.message_stream;
	var notes = connection.transaction.notes;
	var headers = [
		'Return-Path: ' + '<' + connection.transaction.mail_from.address() + '>',
		'Envelope-To: ' + connection.transaction.rcpt_to.join(', ')
	];

	if(!notes.pipe) {
		return next();
	}
	notes.discard = true;
	connection.loginfo(this, "Piping to external command: " + notes.pipeCommand);

	var pipedCommand = new ExternalCommand(
		notes.pipeCommand, notes.pipeArgs, headers, msg_stream,
		function (code, signal, commandInstance) {
			commandInstance.exit = 1;
			connection.logdebug(instance, "Command complete: " + code + " " + signal);
			return next();
		}
	);
};