const Thing = require('../models/Thing');
const fs = require('fs');

exports.createThing = (req, res, next) => {
  console.log(req.body)
  const thingObject = JSON.parse(req.body.sauce);
   delete thingObject._id;
   delete thingObject._userId;
   const thing = new Thing({
       ...thingObject,
       userId: req.auth.userId,
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
       likes: 0,
       dislikes: 0,
       usersLiked: [],
       usersDisliked: []
   });
 
   thing.save()
   .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
   .catch(error => { res.status(400).json( { error })})
};

exports.getOneThing = (req, res, next) => {
  Thing.findOne({
    _id: req.params.id
  }).then(
    (thing) => {
      res.status(200).json(thing);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifyThing = (req, res, next) => {
  const thingObject = req.file ? {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
} : { ...req.body };
delete thingObject._userId;
Thing.findOne({_id: req.params.id})
    .then((thing) => {
        if (thing.userId != req.auth.userId) {
            res.status(401).json({ message : 'Not authorized'});
        } else {
          if (req.file) {
            const filename = thing.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, (err) => { console.log(err) });
          }
          Thing.updateOne({ _id: req.params.id }, { ...thingObject, _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Sauce modifié!' }))
            .catch(error => res.status(401).json({ error }));
        }
    })
    .catch((error) => {
        res.status(400).json({ error });
    });
};

exports.deleteThing = (req, res, next) => {
  Thing.findOne({ _id: req.params.id})
       .then(thing => {
           if (thing.userId != req.auth.userId) {
               res.status(401).json({message: 'Not authorized'});
           } else {
               const filename = thing.imageUrl.split('/images/')[1];
               fs.unlink(`images/${filename}`, () => {
                   Thing.deleteOne({_id: req.params.id})
                       .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                       .catch(error => res.status(401).json({ error }));
               });
           }
       })
       .catch( error => {
           res.status(500).json({ error });
       });
};

exports.getAllStuff = (req, res, next) => {
  Thing.find().then(
    (things) => {
      console.log(things)
      res.status(200).json(things);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.likes = (req, res, next) => {
  if (![1, -1, 0].includes(req.body.like)) 
      return res.status(403).send({message: 'Valeur du like invalide !'});
  Thing.findOne({_id: req.params.id})
    .then((sauce) => {
        if (req.body.like === 1) {
          if (!sauce.usersLiked.includes(req.body.userId)) {
            sauce.likes++
            sauce.usersLiked.push(req.body.userId)
            sauce.save()
              .then(() => { res.status(201).json({message: 'Sauce liked'})})
              .catch(error => { res.status(400).json( { error })})
          }
          else {
            return res.status(400).json({message: 'Already liked'});
          }
        }
        if (req.body.like === 0) {
          if (sauce.usersLiked.includes(req.body.userId)) {
            sauce.likes--
            sauce.usersLiked = sauce.usersLiked.filter(user => user !== req.body.userId)
            sauce.save()
              .then(() => { res.status(201).json({message: 'Sauce unliked'})})
              .catch(error => { res.status(400).json( { error })})
          }
          if (sauce.usersDisliked.includes(req.body.userId)) {
            sauce.dislikes--
            sauce.usersDisliked = sauce.usersDisliked.filter(user => user !== req.body.userId)
            sauce.save()
              .then(() => { res.status(201).json({message: 'Sauce undisliked'})})
              .catch(error => { res.status(400).json( { error })})
          }
        }
        if (req.body.like === -1) {
          if (!sauce.usersDisliked.includes(req.body.userId)) {
            sauce.dislikes++
            sauce.usersDisliked.push(req.body.userId)
            sauce.save()
              .then(() => { res.status(201).json({message: 'Sauce disliked'})})
              .catch(error => { res.status(400).json( { error })})
          }
          else {
            return res.status(400).json({message: 'Already disliked'});
          }
        }
      })
    .catch((error) => {
        res.status(400).json({ error });
    });
}