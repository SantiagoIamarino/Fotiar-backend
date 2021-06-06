const Tag = require('../models/tag');

module.exports = {
    updateTag: function (tagValue, images, remove = false) {
        return new Promise((resolve, reject) => {
            Tag.findOne({value: tagValue}, (err, tagDB) => {
                if(err) {
                    reject(err);
                }
    
                if(!tagDB) {
                    reject('Tag not found');
                }
    
                images.forEach(imageId => {
                    const tagIndex = tagDB.imagesLinked.indexOf(imageId);
    
                    if(tagIndex >= 0) { // Image already linked
    
                        if(remove) { // Has to remove
                            tagDB.imagesLinked.splice(tagIndex, 1);
                        }
                        
                    } else if(!remove) { // Has to add
                        tagDB.imagesLinked.push(imageId);
                    }
                });
    
                tagDB.update(tagDB, (errUpdt, tagUpdated) => {
                    if(errUpdt) {
                        reject(errUpdt);
                    }
    
                    resolve();
                })
            })
        })
    }
}