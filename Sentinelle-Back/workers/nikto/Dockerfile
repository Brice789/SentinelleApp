FROM debian:latest

RUN apt-get update && apt-get install -y \
    perl \
    git \
    libnet-ssleay-perl \
    libio-socket-ssl-perl \
    libwww-perl \
    unzip \
    wget && \
    git clone https://github.com/sullo/nikto.git /opt/nikto && \
    ln -s /opt/nikto/program/nikto.pl /usr/local/bin/nikto

WORKDIR /opt/nikto

ENTRYPOINT ["nikto"]
