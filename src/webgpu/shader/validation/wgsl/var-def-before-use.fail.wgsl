// v-0006 - Fails because 'a' is not defined.

[[stage(vertex)]]
fn main() {
  var b : f32 = 1.0;
  a = 4;
  return;
}
