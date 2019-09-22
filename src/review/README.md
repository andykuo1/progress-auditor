# Review
The review system is modularized by schemes. Each scheme has a chance to register its review types with the ReviewRegistry. Currently there are only 2 available schemes: piazza and base.

Piazza includes the base scheme, so it registers the base before its own reviews.

In the future, if another platform needs to be supported, therefore a new host of review types to resolve or auto-resolve certain issues, then you should make a new scheme type.

The base scheme type has been generalized to where it should still be useful to other platforms. So it is expected for you to also include its
reviews like the piazza scheme.

**NOTE**: Not all review types are resolved by the client. There are some reviews (for examples, checkout all custom piazza reviews), that run without input. I refer to these as auto-reviews (used to be called resolvers), since they automatically run without stopping to ask the user for input or read from the review database.
