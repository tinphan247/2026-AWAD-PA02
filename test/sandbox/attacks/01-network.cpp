// Minimum 1: no network. Tries a TCP connection and a DNS lookup.
// Prints "blocked" when both fail; anything else means the sandbox leaked.
#include <arpa/inet.h>
#include <netdb.h>
#include <sys/socket.h>
#include <unistd.h>
#include <cstdio>

int main() {
  bool leaked = false;
  int fd = socket(AF_INET, SOCK_STREAM, 0);
  if (fd >= 0) {
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(80);
    inet_pton(AF_INET, "1.1.1.1", &addr.sin_addr);
    if (connect(fd, reinterpret_cast<sockaddr*>(&addr), sizeof addr) == 0) leaked = true;
    close(fd);
  }
  addrinfo* res = nullptr;
  if (getaddrinfo("example.com", "80", nullptr, &res) == 0) {
    leaked = true;
    freeaddrinfo(res);
  }
  std::puts(leaked ? "LEAK" : "blocked");
}
