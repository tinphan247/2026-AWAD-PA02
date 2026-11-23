#include <bits/stdc++.h>
using namespace std;
#define all(v) (v).begin(), (v).end()
#define TOP(v, k) partial_sort((v).begin(), (v).begin() + (k), (v).end(), greater<int>())

int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (auto& x : v) cin >> x;
    TOP(v, n);
    for (int i = 0; i < n; i++) cout << v[i] << (i + 1 < n ? ' ' : '\n');
    return 0;
}
