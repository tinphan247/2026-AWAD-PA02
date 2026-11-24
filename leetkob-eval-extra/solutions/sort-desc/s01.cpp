#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int a[1005];
    for (int i = 0; i < n; i++) cin >> a[i];
    // a lambda called sort: insertion sort, largest first
    auto sort = [](int* v, int len) {
        for (int i = 1; i < len; i++) {
            int key = v[i], j = i - 1;
            while (j >= 0 && v[j] < key) {
                v[j + 1] = v[j];
                j--;
            }
            v[j + 1] = key;
        }
    };
    sort(a, n);
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? ' ' : '\n');
    return 0;
}
