import {Common} from './common'
import {Utility} from './utility';

export class Node {
  static inject() { return [Common, Utility]; }
  constructor(common, utility){
    this.common = common;
    this.utility = utility;

    this.childVMList = [];


  }

  addChildVM(vm, id) {
    var insertPoint = -1;
    for (var i = 0; i < this.node.children.length; i++) {
      if (this.node.children[i] == id) {
        insertPoint = i;
        break;
      }
    };
    if (insertPoint != -1) {
      this.childVMList.splice(insertPoint, 0, vm);
    };
    // console.log("this.childVMList")
    // console.log(this.childVMList)
  }

  addObserver(node) {
    // console.log("addObserver-----------------------------------------------")
    // function isReallyChange (changes) {
    //   var  really = true;
    //   for (var i = 0; i < changes.length; i++) {
    //     var bypassList = ["__observer__", "__observers__", "__array_observer__"];
    //     for (var j = 0; j < bypassList.length; j++) {
    //       if (changes[i].name == bypassList[j]) {
    //         really = false;
    //         break;
    //       }
    //     };
    //   };
    //   return really;
    // }

    // var that = this;


    // if (!this.localObserver) {
    //   this.localObserver = function (changes) {
    //     if (!isReallyChange(changes)) return;
    //     if (that.rootVM.updating) return;
    //     that.doEdit(function() {
    //       that.setNodeToServer(node);
    //     })
    //   }

    //   Object.observe(node, this.localObserver);
    // }




    var that = this;
    if (!this.remoteObserver) {
      this.remoteObserver = function(dataSnapshot) {
        // console.log("remoteObserver")
        // console.log(dataSnapshot.val())
        if (that.rootVM.editing) return;
        if (that.utility.now() - that.rootVM.setToRemoteTime < 2000) return;
        var newNode = dataSnapshot.val();
        if (!newNode) return;
        if (that.utility.isSameNode(that.node, newNode)) return;
        that.doUpdate(newNode);
      }
      this.rootVM.nodesRef.child(node.id).on("value", this.remoteObserver);  
    }
  }

  removeObserver() {
    // console.log("removeObserver")
    if (!this.node) return;
    if (this.localObserver)
      Object.unobserve(this.node, this.localObserver);
    if (this.remoteObserver)
      this.rootVM.nodesRef.child(this.node.id).off("value", this.remoteObserver);
  }

  // asyncEdit(realEdit) {
  //   var that = this;
  //   var edit = function() {
  //     if (that.rootVM.editing &&
  //         that.utility.now() - that.rootVM.localChangedTime
  //         < that.rootVM.localChangeWaitTime - that.rootVM.localChangeWaitEpsilon) {
  //       setTimeout(edit, that.rootVM.localChangeWaitTime);
  //     } else {
  //       realEdit();
  //       that.rootVM.editing = false;
  //     }
  //   }
  //   this.rootVM.localChangedTime = this.utility.now();
  //   if (!this.rootVM.editing) {
  //     this.rootVM.editing = true;
  //     setTimeout(edit, that.rootVM.localChangeWaitTime);
  //   };
  // }

  setNodeToServer(node_id) {
    var nodeRef = this.rootVM.nodesRef.child(node_id)
    // var newNode = new Object();
    // this.utility.copyAttributesWithoutChildren(newNode, node);
    // newNode.children = [];
    // for (var i = 0; i < node.children.length; i++) {
    //   newNode.children.push(node.children[i]);
    // };
    var that = this;
    this.doEdit(function() {
      // console.log("setNodeToServer")
      var newNode = new Object();
      that.utility.copyAttributes(newNode, that.rootVM.file.nodes[node_id])
      nodeRef.set(newNode);
    });
    // this.rootVM.editing = false;

    // this.rootVM.setToRemoteTime = this.utility.now();
    // console.log("setNodeToServer")
    // var t = new Date(that.rootVM.setToRemoteTime)
    // console.log("localObserver:"+t.toLocaleTimeString()+" "+t.getMilliseconds());
    // console.log(newNode);   
  }

  doEdit(realEdit) {
    // var ref = new Firebase(this.common.firebase_url);
    // var authData = ref.getAuth();
    // if (!authData) {
    //   console.log("Please login!")
    //   return;
    // }
    // var nodePath = '/notes/users/' + authData.uid +
    //   '/files/' + file_id + '/nodes/' + node_id;
    // // console.log(nodePath);
    // var nodeRef = ref.child(nodePath);

    
    
    var that = this;
    var edit = function() {
      if (that.rootVM.editing &&
          that.utility.now() - that.rootVM.localChangedTime
          < that.rootVM.localChangeWaitTime - that.rootVM.localChangeWaitEpsilon) {
        setTimeout(edit, that.rootVM.localChangeWaitTime);
        // console.log("setTimeout2")
      } else {
        that.rootVM.editing = false;
      }
    }
    this.rootVM.localChangedTime = this.utility.now();
    if (!this.rootVM.editing) {
      this.rootVM.editing = true;
      setTimeout(edit, that.rootVM.localChangeWaitTime);
      // console.log("setTimeout1")
    };
    realEdit();
  }

  doUpdate(newNode) {
    // var ref = new Firebase(this.common.firebase_url);
    // var authData = ref.getAuth();
    // if (!authData) {
    //   console.log("Please login!")
    //   return;
    // }
    // var nodePath = '/notes/users/' + authData.uid +
    //   '/files/' + file_id + '/nodes/' + node_id;
    // console.log(nodePath);
    // var nodeRef = ref.child(nodePath);
    // console.log("doUpdate---------------------------------------------------------------------")
    var that = this;
    var update = function() {
      // console.log("that.rootVM.receiveRemoteTime")
      // console.log(that.rootVM.receiveRemoteTime)
      if (that.utility.now() - that.rootVM.receiveRemoteTime
          < that.rootVM.remoteChangeWaitTime - that.rootVM.remoteChangeWaitEpsilon) {
        setTimeout(update, that.remoteChangeWaitTime);
      } else {
        that.rootVM.updating =false;
        // console.log("that.rootVM.updating =false;")
      }
    }
    if (!this.rootVM.updating) {
      this.rootVM.updating = true;
      setTimeout(update, that.rootVM.remoteChangeWaitTime);
    };
    // remove observer.
    for (var i = this.node.children.length - 1; i >= 0; i--) {
      var removed = true
      for (var j = 0; newNode.children && j < newNode.children.length; j++) {
        if (this.node.children[i] == newNode.children[j]) {
          removed = false;
          break;
        }
      }
      if (removed) {
        // var that = this;
        var remove_observer = function(vm) {
          // Object.unobserve(vm.node, vm.localObserver);
          // that.rootVM.nodesRef.child(vm.node.id).off("value", vm.remoteObserver);
          // vm.remoteObserver = undefined;
          vm.removeObserver();
          for (var i = 0; i < vm.childVMList.length; i++) {
            remove_observer(vm.childVMList[i]);
          };
        }
        remove_observer(this.childVMList[i]);
      };
    };

    // console.log("this.utility.copyAttributes(this.node, newNode);")
    // console.log(this.node);
    // console.log(newNode)

    // flat view needs children be loaded before being added.
    if (this.node.id == "root") {
      var newChildrenList = [];
      for (var i = 0; newNode.children && i < newNode.children.length; i++) {
        var find = false;
        for (var j = 0; this.node.children && j < this.node.children.length; j++) {
          if (newNode.children[i] == this.node.children[j]) {
            find = true;
            break;
          }
        };
        if (!find) {
          newChildrenList.push(newNode.children[i])
        };
      };
      
      if (newChildrenList.length != 0) {
        var count = 0;
        for (var i = 0; i < newChildrenList.length; i++) {
          this.nodesRef.child(newChildrenList[i]).once("value", function(dataSnapshot) {
            var childNode = dataSnapshot.val();
            that.file.nodes[childNode.id] = childNode;
            count++;
            if (count == newChildrenList.length) {
              that.utility.copyAttributes(that.node, newNode);
              that.rootVM.receiveRemoteTime = that.utility.now();
              setTimeout(function() {
                if (that.resize) that.resize();
              }, 0)
            };
          })
          newChildrenList[i]
        };
        this.rootVM.receiveRemoteTime = this.utility.now();
        return;  
      }
    }
    this.utility.copyAttributes(this.node, newNode);
    this.rootVM.receiveRemoteTime = this.utility.now();
    setTimeout(function() {
      // if (that.resize) that.resize();
      if (that.foldNode) that.foldNode();
    }, 0)
  }

  getNodeListByRootId(rootId) {
    var nodeList = [];
    var that = this;
    function visit(node_id) {
      var node = that.file.nodes[node_id];
      nodeList.push(node);
      for (var i = 0; i < node.children.length; i++) {
        visit(node.children[i])
      };
    }
    visit(rootId);
    return nodeList;
  }

  insertSubTree(parent_id, insertPosition, sub_tree, root_id) {
    var parent = this.rootVM.file.nodes[parent_id];
    for (var i = 0; i < sub_tree.length; i++) {
      this.rootVM.file.nodes[sub_tree[i].id] = sub_tree[i];
    };

    if (!parent.children) {parent.children = []};
    parent.children.splice(insertPosition, 0, root_id);
    // this.doEdit(parent, this.rootVM.file_id, parent.id);

    // Do not use doEdit(). Set it directly. It's not text editing.
    this.setNodeListToServer(sub_tree);
    this.setNodeChildrenToServer(this.file.nodes[parent_id]);
    console.log("setNodeChildrenToServer");
    console.log(this.file.nodes[parent_id])
    this.rootVM.setToRemoteTime = this.utility.now();
  }


  loadNode(node_id, force) {
    if (force || !this.node) {
      this.node = this.rootVM.file.nodes[node_id];
      if (this.node) {
        if (!this.node.children) this.node.children = [];
        this.addObserver(this.node);
      } else {
        this.loadNodeFromServer(node_id);
      }
    }
  }

  loadNodeFromServer(node_id) {
    console.log("loadNodeFromServer: "+node_id)
    // var ref = new Firebase(this.common.firebase_url);
    // var authData = ref.getAuth();
    // if (!authData) {
    //   console.log("Please login!")
    //   return;
    // }
    // var nodePath = '/notes/users/' + authData.uid +
    //     '/files/' + file_id + '/nodes/' + node_id;
    // // console.log("nodePath")
    // // console.log(nodePath)
    // var nodeRef = ref.child(nodePath);
    var that = this;
    this.rootVM.nodesRef.child(node_id).once('value', function(dataSnapshot) {
      // console.log("loadNodeFromServer dataSnapshot.val()")
      // console.log(dataSnapshot.val())
      that.node = dataSnapshot.val();
      console.log("loadNodeFromServer: ")
      console.log(that.node);
      if (!that.node) {
        that.node = that.utility.createNewNode();
        that.node.id = node_id;
      }
      if (!that.node.children) {that.node.children = []};
      that.addObserver(that.node);
      that.rootVM.file.nodes[that.node.id] = that.node;
      if (that.node.id != that.rootVM.root_id) {
        if (that.element.children[0].children[1])
          that.ta = that.element.children[0].children[1];
        if (that.ta)
          that.foldNode();
      }
    }, function(error) {
      console.log(JSON.stringify(error))
    });
  }

  openSubTreeInNewWindow(node_id) {
    var url = "#tree/online/" + this.rootVM.user_id + "/" +  this.rootVM.file_id +
        "/" + this.node.id;
    window.open(url);
  }

  removeChildVM(vm) {
    var insertPoint = -1;
    for (var i = 0; i < this.node.children.length; i++) {
      if (this.node.children[i].id == vm.node.id) {
        insertPoint = i;
        break;
      }
    };
    if (insertPoint != -1) {
      this.childVMList.splice(insertPoint, 1);
    };
    // console.log("this.childVMList")
    // console.log(this.childVMList)
  }

  removeSubTree(parent_id, node_id) {
    // console.log("removeSubTree(parent_id, node_id) {")
    // console.log(parent_id)
    // console.log(node_id)
    var parent = this.file.nodes[parent_id];
    var position = -1;
    for (var i = 0; i < parent.children.length; i++) {
      if (parent.children[i] == node_id) {
        position = i;
        break;
      }
    };

    if (-1 == position) return;

    parent.children.splice(position, 1);
    var nodeList = this.getNodeListByRootId(node_id);
    for (var i = 0; i < nodeList.length; i++) {
      this.rootVM.file.nodes[nodeList[i].id] = undefined;
    };

    // doEdit to prevent the modification, which send back from server.
    // var that = this;
    // this.doEdit(function() {
    //   that.setNodeToServer(parent);
    // })

    // Do not use doEdit(). Set it directly. It's not text editing.
    
    console.log("setNodeChildrenToServer");
    console.log(this.file.nodes[parent_id])
    this.removeNodeListFromServer(nodeList);
    this.setNodeChildrenToServer(this.file.nodes[parent_id]);
    this.rootVM.setToRemoteTime = this.utility.now();

    return position;
  }

  record(nodeDataList, operation) {
    var record = {};
    record.operation = operation;
    record.nodeList = nodeDataList;
    
    this.operationRecordList.splice(this.operationRecordList.cursor+1);
    this.operationRecordList.push(record);
    this.operationRecordList.cursor++;
  }

  redo() {
    console.log("redo")
    // console.log($scope.$operationRecordList)
    if (this.operationRecordList.cursor >= this.operationRecordList.length-1) return;

    this.operationRecordList.cursor++;
    var record = this.operationRecordList[this.operationRecordList.cursor];
    if ("insert" == record.operation) {
      for (var i = 0; i < record.nodeList.length; i++) {
        // this.uncollapsed(record.nodeList[i].positionArray);
        // this.insertNodeAt(record.nodeList[i].positionArray, record.nodeList[i].node);
        var r = record.nodeList[i];
        var ret = this.utility.treeToList(r.subTree);
        this.insertSubTree(r.parent_id, r.position, ret.nodes, ret.root_id);
        r.node_id = ret.root_id;
        // // var nodeList = this.getNodeListByRootId(ret.root_id);
        // var that = this;
        // this.doEdit(function() {
        //   that.setNodeListToServer(ret.nodes);
        //   that.setNodeChildrenToServer(that.file.nodes[r.parent_id]);
        //   console.log("setNodeChildrenToServer");
        //   console.log(that.file.nodes[r.parent_id])
        //   that.rootVM.setToRemoteTime = that.utility.now();
        // });
        
        // // this.doEdit(this.file.nodes[r.parent_id]);
      }
    } else if ("remove" == record.operation) {
      for (var i = 0; i < record.nodeList.length; i++) {
        // this.uncollapsed(record.nodeList[i].positionArray);
        // this.removeNodeAt(record.nodeList[i].positionArray);
        var r = record.nodeList[i];
        var nodeList = this.getNodeListByRootId(r.node_id);
        r.subTree = this.utility.listToTree(this.rootVM.file.nodes, r.node_id);
        this.removeSubTree(r.parent_id, r.node_id);

        // this.doEdit(this.file.nodes[r.parent_id]);
      }
    }
  }

  setNodeChildrenToServer(node) {
    var children = [];
    for (var i = 0; i < node.children.length; i++) {
      children.push(node.children[i]);
    };
    this.nodesRef.child(node.id).child("children").set(children)
  }

  removeNodeListFromServer(nodeList) {
    for (var i = 0; i < nodeList.length; i++) {
      this.nodesRef.child(nodeList[i].id).remove();
    };
  }

  setNodeListToServer(nodeList) {
    for (var i = 0; i < nodeList.length; i++) {
      // this.doEdit(nodeList[i]);
      var newNode = new Object();
      this.utility.copyAttributesWithoutChildren(newNode, nodeList[i])
      var children = [];
      for (var j = 0; j < nodeList[i].children.length; j++) {
        children.push(nodeList[i].children[j]);
      };
      newNode.children = children;
      this.nodesRef.child(nodeList[i].id).set(newNode);
    };
  }

  undo() {
    if (this.operationRecordList.cursor < 0) return;
    var record = this.operationRecordList[this.operationRecordList.cursor];
    this.operationRecordList.cursor--;
    if ("insert" == record.operation) {
      for (var i = record.nodeList.length - 1; i >= 0; i--) {
        // this.uncollapsed(record.nodeList[i].positionArray);
        var r = record.nodeList[i];
        r.subTree = this.utility.listToTree(this.rootVM.file.nodes, r.node_id);
        this.removeSubTree(r.parent_id, r.node_id);
        // var that = this;
        // this.doEdit(function() {
        //   that.setNodeChildrenToServer(that.file.nodes[r.parent_id]);
        //   console.log("setNodeChildrenToServer");
        //   console.log(that.file.nodes[r.parent_id])
        //   that.removeNodeListFromServer(nodeList)
          
        //   that.rootVM.setToRemoteTime = that.utility.now();
          
        // });
        // this.doEdit(this.file.nodes[r.parent_id]);
        // this.removeNodeAt(record.nodeList[i].positionArray);
      }
    } else if ("remove" == record.operation) {
      for (var i = record.nodeList.length - 1; i >= 0 ; i--) {
        // this.uncollapsed(record.nodeList[i].positionArray);
        // this.insertNodeAt(record.nodeList[i].positionArray, record.nodeList[i].node);
        var r = record.nodeList[i];
        var ret = this.utility.treeToList(r.subTree);
        this.insertSubTree(r.parent_id, r.position, ret.nodes, ret.root_id);
        r.node_id = ret.root_id;
        // // var nodeList = this.getNodeListByRootId(r.node_id);
        // var that = this;
        // this.doEdit(function() {
        //   that.setNodeListToServer(ret.nodes);
        //   that.setNodeChildrenToServer(that.file.nodes[r.parent_id]);
        //   console.log("setNodeChildrenToServer");
        //   console.log(that.file.nodes[r.parent_id])
        //   that.rootVM.setToRemoteTime = that.utility.now();
        // });
        // // this.doEdit(this.file.nodes[r.parent_id]);
      }
    }
  }

  // addChild(nodeId, before) {
  //   var targetId = -1;
  //   if (arguments.length == 0) {
  //     this.node.children.splice(0, 0, this.utility.createNewNode());
  //   } else {
  //     for (var i = 0; i < this.node.children.length; i++) {
  //       if (this.node.children[i].id == nodeId) {
  //         this.node.children.splice(before?i:i+1, 0, this.utility.createNewNode());
  //         break;
  //       }
  //     };
  //   }
  // }
}