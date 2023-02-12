// Import the required packages and modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// Create an Express application
const app = express();

// Set the view engine to use EJS
app.set("view engine", "ejs");

// Use body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static("public"));

// Connect to the MongoDB database using Mongoose
mongoose.connect(
  "mongodb+srv://kraylik:Lh8db741@cluster0.uz43sca.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Define the schema for the items in the to-do list
const itemsSchema = {
  name: String,
};

// Create a Mongoose model for the items in the to-do list
const Item = mongoose.model("Item", itemsSchema);

// Create default items for the to-do list
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

// Define the schema for the to-do lists
const listSchema = {
  name: String,
  items: [itemsSchema],
};

// Create a Mongoose model for the to-do lists
const List = mongoose.model("List", listSchema);

// Handle a GET request to the root URL
app.get("/", function (req, res) {
  // Find all items in the database
  Item.find({}, function (err, foundItems) {
    // If there are no items in the database
    if (foundItems.length === 0) {
      // Insert the default items into the database
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      // Redirect back to the root URL
      res.redirect("/");
    } else {
      // Render the list page with the found items
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

// Handle a POST request to the root URL
app.post("/", function (req, res) {
  // Get the name of the new item from the request body
  const itemName = req.body.newItem;

  // Get the name of the list from the request body
  const listName = req.body.list;

  // Create a new item with the given name
  const item = new Item({
    name: itemName,
  });

  // If the listName is "Today", save the item to the database and redirect to the root ("/") route.

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    // If the listName is not "Today", find the list with the specified name, add the item to the list,
    //save the list to the database, and redirect to the route for the specified list ("/" + listName).
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
// POST Request for "/delete"
app.post("/delete", function (req, res) {
  // Get the id of the item to be deleted and the list name from the request body.
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  // If the list name is "Today", find and remove the item from the database and redirect to the root ("/") route.
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    // If the list name is not "Today", find the list with the specified name, remove the item from the list, and save the list to the database.
    // Then, redirect to the route for the specified list ("/" + listName).
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

//GET Request for "/:customListName"
app.get("/:customListName", function (req, res) {
  // Get the name of the custom list from the URL parameters.
  const customListName = _.capitalize(req.params.customListName);

  // Find the list with the specified name.
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // If the list does not exist, create a new list with the specified name and the default items.
        //Create a new list
        const newList = new List({
          name: customListName,
          items: defaultItems,
        });
        newList.save();
        res.redirect("/" + customListName);
      } else {
        // If the list exists, render the "list" template and pass the title of the list and its items as variables.
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

// Handle a GET request to the "/about" route
app.get("/about", function (req, res) {
  res.render("about");
});

// the following code listens for requests on port 3000 and logs a message to the console once the server has started
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
