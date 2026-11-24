// Minimum 4: memory and swap limit. Allocates 1 GiB, writes every page and
// reads it back into a checksum it prints, so the compiler cannot drop it.
#include <cstdio>
#include <cstdlib>

int main() {
  const std::size_t size = 1ULL << 30;
  unsigned char* p = static_cast<unsigned char*>(std::malloc(size));
  if (!p) {
    std::puts("malloc refused");
    return 1;
  }
  for (std::size_t i = 0; i < size; i += 4096) p[i] = static_cast<unsigned char>(i >> 12);
  unsigned long long sum = 0;
  for (std::size_t i = 0; i < size; i += 4096) sum += p[i];
  std::printf("%llu\n", sum);
}
