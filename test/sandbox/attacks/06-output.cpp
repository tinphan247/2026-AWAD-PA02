// Minimum 6: output limit. Writes 256 MB; must be cut off, not collected.
#include <cstdio>
#include <cstring>

int main() {
  static char line[4096];
  std::memset(line, 'A', sizeof line - 1);
  for (int i = 0; i < 65536; ++i) std::fputs(line, stdout);
}
