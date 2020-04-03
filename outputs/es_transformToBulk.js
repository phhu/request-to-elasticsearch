/**
 * Transform a stream of documents into a stream of bulk commands to index them.
 * This is more an example than anything else.
 * Overriden here to allow customisation
 */
'use strict';
var Transform = require('stream').Transform;

module.exports = TransformToBulk;

/**
 * @param getIndexTypeId function that is passed a document and returns:
 *            { _index: the_index?, _type: the_type?, _id: the_id? }
 */
function TransformToBulk(getIndexTypeId,operation="index") {
  if (!(this instanceof TransformToBulk)) {
    return new TransformToBulk(getIndexTypeId,operation);
  }
  Transform.call(this, {objectMode:true});
  this.getIndexTypeId = getIndexTypeId;
  this.operation = operation;
}

TransformToBulk.prototype = Object.create(Transform.prototype, {constructor: {value: TransformToBulk}});

TransformToBulk.prototype._transform = function(chunk, encoding, callback) {
  var params = this.getIndexTypeId(chunk);     // get props 
  if (params) {
    this.push({ 
      [this.operation]: params 
    });
    this.push(chunk);     // chunk is the doc. But in upsert, put an object here instead
  }
  callback();
};
