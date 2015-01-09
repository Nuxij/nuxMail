#!/bin/bash

# IN
# jme.rcpt_to.aliases -> /opt/haraka/config/jme.rcpt_to.aliases
# me.mailbox_accounts -> /opt/haraka/config/jme.mailbox_accounts

# OUT
# jme.rcpt_to.aliases -> /opt/haraka/config/jme.rcpt_to.aliases
# jme.mailbox_accounts -> /opt/haraka/config/jme.mailbox_accounts

INSTALL_PATH="/opt/haraka"
CONFIG_PATH="$INSTALL_PATH/config"
IN_PATH="$INSTALL_PATH/haraka-in"
OUT_PATH="$INSTALL_PATH/haraka-out"
NUX_PATH="$INSTALL_PATH/nuxMail"
PLUGIN_PATH="$NUX_PATH/plugins"

main() {
	echo "Welcome! -- Install nuxMail --"

	# Install haraka
	if [[ ! $(npm list -g Haraka | grep Haraka) ]]; then
		if [[ "$(whoami)"  == "root" ]]; then
			npm install -g Haraka
		else
			echo "Please install Haraka globall via: sudo npm install -g Haraka"
			exit 1
		fi
	fi

	# Install haraka default configs
	echo "Cleaning and creating top-level install dir.."
	rm -rf "$INSTALL_PATH" || exit 1
	mkdir -p "$CONFIG_PATH" || exit 1
	echo "Creating default inbound config in $IN_PATH.."
	haraka -i "$IN_PATH" || exit 1
	echo "Creating default outbound config in $OUT_PATH.."
	haraka -i "$OUT_PATH" || exit 1

	git clone https://github.com/Joeasaurus/nuxMail.git "$NUX_PATH" || exit 1

	# Main logic
	ask_hostDomain
	echo "$FQDN" > "$CONFIG_PATH/me"
	createLinks "$CONFIG_PATH/me" "config/me" true || exit 1
	ask_certCreate
	create_SmtpGreeting
	create_SmtpIni

	create_InboundPlugins
	create_OutboundPlugins
	create_AliasesConfig
	create_MailboxesConfig

	link_nuxMailPlugins

	edgeConfigs
}

createLinks() {
	local delete="$3"
	local inout="$4"
	if [[ ! "$delete" =~ ^(true|false)$ ]]; then
		inout="$delete"
		delete="false"
	fi
	if [[ ! "$inout" =~ ^(in|out)$ ]]; then
		inout="both"
	fi
	if [[ "$delete" == "true" ]]; then
		rm -rf "$IN_PATH/$2" "$OUT_PATH/$2"
	fi
	case "$inout" in
		in)
			ln -s "$1" "$IN_PATH/$2";;
		out)
			ln -s "$1" "$OUT_PATH/$2";;
		both)
			ln -s "$1" "$IN_PATH/$2"
			ln -s "$1" "$OUT_PATH/$2"
			;;
	esac
}

ask_hostDomain() {
	read -p "What is your domain? " DOMAIN
	read -p "Is $(hostname).$DOMAIN the FQDN? [y/n] " FQDN
	if [[ "$FQDN" != [YyNn] ]]; then
		echo "Please answer yes or no."
		ask_hostDomain
	elif [[ "$FQDN" == [Nn] ]]; then
		ask_hostDomain
	else
		FQDN="$(hostname).$DOMAIN"
	fi
}

ask_certCreate() {
	local tls_cert_name="$DOMAIN.tls_cert.pem"
	local tls_key_name="$DOMAIN.tls_key.pem"
	echo "Creating symlinks.."
	createLinks "$CONFIG_PATH/$tls_cert_name" "config/$tls_cert_name" || exit 1
	createLinks "$CONFIG_PATH/$tls_key_name" "config/$tls_key_name" || exit 1
	read -p "Do you have your own SSL certificates? [y/n] " CERT_CREATE
	if [[ "$CERT_CREATE" != [YyNn] ]]; then
		echo "Please answer yes or no."
		ask_certCreate
	elif [[ "$CERT_CREATE" == [Yy] ]]; then
		echo "Fair play man, just put the cert at $CONFIG_PATH/$tls_cert_name and the key at $CONFIG_PATH/$tls_key_name"
	elif [[ "$CERT_CREATE" == [Nn] ]]; then
		echo "Please answer the below to generate a key and cert."
		echo "!!!!!The important bit is the CN should be this server's FQDN ($FQDN)!!!!!!"
		openssl req -x509 -nodes -days 2190 -newkey rsa:2048 \
			-keyout "$CONFIG_PATH/$tls_key_name" -out "$CONFIG_PATH/$tls_cert_name" || exit 1
	fi
}

create_SmtpGreeting() {
	echo "Setting SMTP greeting message.."
	cat > "$CONFIG_PATH/smtpgreeting" <<EOF
Welcome to $DOMAIN!
EOF
	createLinks "$CONFIG_PATH/smtpgreeting" "config/smtpgreeting" true
}

create_SmtpIni() {
	echo "Creating smtp.ini configs.."
	for direction in inbound outbound; do
		[[ "$direction" == "inbound" ]] && \
			local port=25 && \
			local filePath="$CONFIG_PATH/$direction.smtp.ini" && \
			local targetFile="$IN_PATH/config/smtp.ini"
		[[ "$direction" == "outbound" ]] && \
			local port=587 && \
			local filePath="$CONFIG_PATH/$direction.smtp.ini" && \
			local targetFile="$OUT_PATH/config/smtp.ini"
		cat > "$filePath" <<EOF
; address to listen on (default: all IPv6 and IPv4 addresses, port 25)
; use "[::0]:25" to listen on IPv6 and IPv4 (not all OSes)
listen=[::0]:$port

; Note you can listen on multiple IPs/ports using commas:
;listen=127.0.0.1:2529,127.0.0.2:2529,127.0.0.3:2530

; public IP address (default: none)
; If your machine is behind a NAT, some plugins (SPF, GeoIP) gain features
; if they know the servers public IP. If 'stun' is installed, Haraka will
; try to figure it out. If that doesn't work, set it here.
;public_ip=N.N.N.N

; Time in seconds to let sockets be idle with no activity
inactivity_timeout=300

; Drop privileges to this user/group
user=haraka
group=haraka

; Don't stop Haraka if plugins fail to compile
;ignore_bad_plugins=0

; Run using cluster to fork multiple backend processes
;nodes=cpus

; Daemonize
daemonize=true
daemon_log_file=/var/log/haraka/haraka-$direction.log
daemon_pid_file=/var/run/haraka-$direction.pid

; Spooling
; Save memory by spooling large messages to disk
spool_dir=/var/spool/haraka/haraka-$direction
; Specify -1 to never spool to disk
; Specify 0 to always spool to disk
; Otherwise specify a size in bytes, once reached the
; message will be spooled to disk to save memory.
spool_after=1024
EOF
		rm -rf "$targetFile" || exit 1
		ln -s "$filePath" "$targetFile" || exit 1
	done
}

create_InboundPlugins() {
	echo "Creating inbound plugins config.."
	cat > "$CONFIG_PATH/in.plugins" <<EOF
process_title
tls
access
dnsbl
data.headers
helo.checks
mail_from.is_resolvable
max_unrecognized_commands
rcpt_to.max_count
jme.rcpt_to.disposable
jme.rcpt_to.aliases
jme.rcpt_to.mailboxes
queue/discard
EOF
	rm -rf "$IN_PATH/config/plugins" || exit 1
	ln -s "$CONFIG_PATH/in.plugins" "$IN_PATH/config/plugins" || exit 1
}

create_OutboundPlugins() {
	echo "Creating outbound plugins config.."
	cat > "$CONFIG_PATH/out.plugins" <<EOF
process_title
tls
auth/jme.auth.flat_file.sha512crypt
jme.queue_outbound.accounts
EOF
	rm -rf "$OUT_PATH/config/plugins" || exit 1
	ln -s "$CONFIG_PATH/out.plugins" "$OUT_PATH/config/plugins" || exit 1
}

create_AliasesConfig() {
	echo "Creating default aliases.."
	local rootAddress
	local rootAlias
	read -p "What is your root email address? [root@$DOMAIN] " rootAddress
	if [[ "$rootAddress" == "" ]]; then
		rootAddress="root@$DOMAIN"
		echo "Keeping default $rootAddress.."
	else
		if [[ "$rootAddress" =~ (.+)@.* ]]; then
			if [[ "${BASH_REMATCH[1]}" != "root" ]]; then
				rootAlias=",
			\"root\": \"$rootAddress\""
			fi
		else
			rootAddress="root@$DOMAIN"
			echo "Invalid email address, defaulting to $rootAddress.."
			rootAlias=",
			\"root\": \"$rootAddress\""
		fi
	fi
	cat > "$CONFIG_PATH/jme.rcpt_to.aliases" <<EOF
{
	"authMethod": "file",
	"aliases": {
		"$DOMAIN": {
			"admin": "root",
			"postmaster": "root",
			"dev": "root"$rootAlias
		}
	}
}
EOF
	createLinks "$CONFIG_PATH/jme.rcpt_to.aliases" "config/jme.rcpt_to.aliases" || exit 1
}

create_MailboxesConfig() {
	echo "Creating mailbox accounts.."
	cat > "$CONFIG_PATH/jme.mailbox_accounts" <<EOF
{
	"authMethod": "file",
	"accounts": {
		"$DOMAIN": {
			"root": {}
		}
	}
}
EOF
	createLinks "$CONFIG_PATH/jme.mailbox_accounts" "config/jme.mailbox_accounts" || exit 1
}

link_nuxMailPlugins() {
	echo "Linking nuxMail plugins.."
	createLinks "$PLUGIN_PATH/jme.auth.flat_file.sha512crypt.js" "plugins/auth/jme.auth.flat_file.sha512crypt.js" "out" || exit 1
	createLinks "$PLUGIN_PATH/jme.queue_outbound.accounts.js" "plugins/jme.queue_outbound.accounts.js" "out" || exit 1
	createLinks "$PLUGIN_PATH/jme.rcpt_to.disposable.js" "plugins/jme.rcpt_to.disposable.js" "in" || exit 1
	createLinks "$PLUGIN_PATH/jme.rcpt_to.aliases.js" "plugins/jme.rcpt_to.aliases.js" "in" || exit 1
	createLinks "$PLUGIN_PATH/jme.rcpt_to.mailboxes.js" "plugins/jme.rcpt_to.mailboxes.js" "in" || exit 1
}

edgeConfigs() {
	echo "Configuring edge settings.."
	# Log level
	echo "LOGPROTOCOL" > "$CONFIG_PATH/loglevel"
	createLinks "$CONFIG_PATH/loglevel" "config/loglevel" true
	# Set size limit of emails
	echo "20971520" > "$CONFIG_PATH/databytes"
	createLinks "$CONFIG_PATH/databytes" "config/databytes" true
}


# Go
main