#include <iostream>

int a[1005];

// insert a[k] into the sorted prefix a[0..k-1] (largest first)
void insertAt(int k) {
    if (k == 0 || a[k - 1] >= a[k]) return;
    int t = a[k - 1];
    a[k - 1] = a[k];
    a[k] = t;
    insertAt(k - 1);
}

void sortPrefix(int len) {
    if (len <= 1) return;
    sortPrefix(len - 1);
    insertAt(len - 1);
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; i++) std::cin >> a[i];
    sortPrefix(n);
    for (int i = 0; i < n; i++) std::cout << a[i] << (i + 1 < n ? ' ' : '\n');
    return 0;
}
