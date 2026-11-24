// Minimum 5: process limit. Tries to start 200 processes; prints "capped" when
// the sandbox refuses well before that.
#include <unistd.h>
#include <cstdio>

int main() {
  int started = 0;
  for (int i = 0; i < 200; ++i) {
    pid_t pid = fork();
    if (pid < 0) break;
    if (pid == 0) {
      pause();
      _exit(0);
    }
    ++started;
  }
  std::puts(started < 32 ? "capped" : "LEAK");
}
