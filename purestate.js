// PureState.js
// A minimalistic yet sufficient implementation of observables.

var PureState = (function(){
  var captured_deps = [];
  var capturing_deps = false;

  // Refreshes the value of a node.
  function refresh(node){
    // Gathers the values that this node depend on
    // and calls its compute() function with them.
    node.value = node.compute.apply(null);

    // Refresh each node that depends on this one.
    for (var i=0; i<node.depended_by.length; ++i)
      refresh(node.depended_by[i]);
  };

  // To build a stateful value, you must provide either
  // the initial state (a JS value) or a computed state,
  // i.e., a function that uses other stateful values.
  function state(compute){
    // This sets the compute function of the node, i.e., the function that is
    // used to compute a state value in function of other states.  A
    // non-computed state is actually a computed state where the computing
    // function has no arguments, so we wrap such function around the value.
    function wrap_function(compute){
      if (typeof compute !== "function")
        return function(){ return compute; };
      else
        return compute;
    };
    node.compute = wrap_function(compute);

    // The state object can be called with or without an argument. If it is
    // called without an argument, it just returns its value. If it is caleld
    // with an argument, it refreshes the computing function of that state and
    // returns the new value.
    function node(new_compute){
      // If we are in the variable capture phase (ref below), then we push this
      // node to the `capture_deps` array.
      if (capturing_deps)
        captured_deps.push(node);
      // Otherwise, we do what was described above.
      if (new_compute !== undefined){
        node.compute = wrap_function(new_compute);
        refresh(node);
      };
      return node.value;
    }

    // The variable capture phase is a little small hack that allows us not to
    // need to specify a list of dependencies for a computed function. It works
    // by globally changing the behavior of every state object so that, instead
    // of doing what it does (get/set its state), it just reports its existence
    // to a dependency collector array. This looks ugly in code, but can be
    // seen as a workaround for a language limitation. It is mostly innofensive
    // and avoids a lot of boilerplate. 
    node.depended_by = [];
    captured_deps = [];
    capturing_deps = true;
    node.compute();
    capturing_deps = false;

    for (var i=0; i<captured_deps.length; ++i)
      captured_deps[i].depended_by.push(node);

    // When the node is properly built, we just bootstrap its initial value by
    // refreshing it. This avoids a little code duplication.
    refresh(node);

    return node;
  };

  return state;
})();
if (typeof module !== "undefined") module.exports = PureState;
