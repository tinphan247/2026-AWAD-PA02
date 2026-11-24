// Minimum 3: wall-clock limit. Uses no CPU, sleeps, and leaves a child in its
// own session that would outlive the parent if only the parent were killed.
#include <unistd.h>

int main() {
  if (fork() == 0) {
    setsid();
    sleep(3600);
    return 0;
  }
  sleep(3600);
}
