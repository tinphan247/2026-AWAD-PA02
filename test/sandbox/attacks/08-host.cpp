// Minimum 8: no host mount, no Docker socket. Prints "isolated" when there is
// no Docker socket, the root file system is read-only, and every mount is one
// Docker itself makes for any container.
#include <unistd.h>
#include <cstdio>
#include <cstring>
#include <set>
#include <string>

int main() {
  bool leaked = false;
  const char* sockets[] = {"/var/run/docker.sock", "/run/docker.sock",
                           "/run/containerd/containerd.sock"};
  for (const char* s : sockets)
    if (access(s, F_OK) == 0) leaked = true;

  if (FILE* f = std::fopen("/leetkob-write-probe", "w")) {
    leaked = true;
    std::fclose(f);
  }

  const std::set<std::string> allowed = {
      "/", "/proc", "/dev", "/dev/pts", "/dev/mqueue", "/dev/shm", "/sys", "/sys/fs/cgroup",
      "/tmp", "/etc/resolv.conf", "/etc/hostname", "/etc/hosts", "/dev/console"};
  if (FILE* m = std::fopen("/proc/mounts", "r")) {
    char dev[512], dir[512];
    while (std::fscanf(m, "%511s %511s %*[^\n]", dev, dir) == 2) {
      std::string d = dir;
      bool ok = allowed.count(d) || d.rfind("/proc/", 0) == 0 || d.rfind("/sys/", 0) == 0 ||
                d.rfind("/dev/", 0) == 0;
      if (!ok) leaked = true;
    }
    std::fclose(m);
  }
  std::puts(leaked ? "LEAK" : "isolated");
}
