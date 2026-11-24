// Minimum 7: not root. Prints "nonroot" when it is not root and cannot
// become root.
#include <unistd.h>
#include <cstdio>

int main() {
  bool root = getuid() == 0 || geteuid() == 0 || setuid(0) == 0;
  std::puts(root ? "LEAK" : "nonroot");
}
