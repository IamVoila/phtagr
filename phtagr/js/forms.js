/** Define global data variable to store the contents of replaced elements */
var Data=new Array();
var images=new Array();

/** Print the node information of a node. The function appends a PRE node to
 * the to node.
  @param src Source node, which has to be debugged
  @param dst Destination node, where the debug information has to be printed 
  @param maxDepth Maximum of depth*/
function _debugNode(src, dst, maxDepth)
{
  if (src==null || dst==null)
    return;
    
  var t=document.createTextNode("");
  _printNode(t, src, 0, maxDepth, "0");

  var pre=document.createElement("pre");
  pre.appendChild(t);
  dst.appendChild(pre);
}

/** Prints recursivly detailed information about the node and add the text data
 * to the text node 
  @param t Textnode
  @param e Current element
  @param depth Current depth
  @param maxDepth Maximum of depth
  @param path String of path 
  @return No return value */
function _printNode(t, e, depth, maxDepth, path)
{
  var i, j, cn=0, an=0;
  
  if (depth>maxDepth)
    return;

  var text="";
  for (i=0; i<depth; i++)
    text+="  ";
    
  switch (e.nodeType) {
    case 1:
      an=e.attributes.length;
      text+="Element "+e.nodeName;
      break;
    case 2:
      text+="Attribute "+e.nodeName;
      break;
    case 3:
      text+="Text";
      break;
    default:
      text+="Other";
      break;
  }
  if (e.hasChildNodes())
  {
    cn=e.childNodes.length;
    if (cn==1)
      text+=" ("+cn+" child)";
    else
      text+=" ("+cn+" children)";
  }
  
  if (e.nodeValue!=null)
    text+=": '"+e.nodeValue+"'";
  text+=" ["+path+"]";
  text+="\n"; 
  t.nodeValue+=text;

  for (j=0; j<an; j++)
  {
    text="";
    for (i=0; i<depth+1; i++)
      text+="  ";
    text+="@"+e.attributes[j].nodeName+"=";
    text+=e.attributes[j].nodeValue;
    text+="\n";
    t.nodeValue+=text;
  }

  for (i=0; i<cn; i++)
  {
    _printNode(t, e.childNodes[i], depth+1, maxDepth, path+"."+i);
  }
}

/** Resets a node with the old value. The node with ID of nodeId was cloned to
 * the Data array. 
  @param nodeId Node ID of the Data array */
function resetNode(nodeId)
{
  var from=document.getElementById(nodeId);
  var to=Data[nodeId];
  
  if (from==null || to==null)
    return;

  var p=from.parentNode;

  p.replaceChild(to, from);

  Data[nodeId]=null;
}

/** Prints the whole caption 
  @param id Id of the caption element
  @param caption64 Original caption in base64 */
function print_caption(id, caption64)
{
  var nodeId="caption-text-"+id;
  var e=document.getElementById(nodeId);
  if (e==null)
    return;

  if (Data[nodeId]!=null)
  {
    resetNode(nodeId);
    return;
  }
  
  // Remember old content
  Data[nodeId]=e.cloneNode(true);

  caption=atob(caption64);
  var text=document.createTextNode(caption+" ");
  
  var span=document.createElement("span");
  span.setAttribute("class", "jsbutton");
  span.setAttribute("onclick", "resetNode('"+nodeId+"')");
  span.appendChild(document.createTextNode("[-]"));
  
  while (e.hasChildNodes())
    e.removeChild(e.lastChild);
  e.appendChild(text);
  e.appendChild(span);
}
  
/** Insert a form for caption 
  @param id Id of capation element
  @param caption64 Original caption in base64 */
function add_form_caption(id, caption64)
{
  var nodeId="caption-"+id;
  var e=document.getElementById(nodeId);
  if (e==null)
    return;

  var focusId=nodeId+"-edit";

  // Remember old content
  Data[nodeId]=e.cloneNode(true);
  
  var form=document.createElement("form");
  form.setAttribute("action", "index.php");
  form.setAttribute("method", "post");

  // copy all hidden inputs from formExplorer or formImage
  // whichever exists
  var srcForm;
  if (document.getElementById("formExplorer"))
  {
    srcForm=document.getElementById("formExplorer");
  }
  else
  {
    srcForm=document.getElementById("formImage");
  }
  _clone_hidden_input(srcForm, form);
  
  var input=document.createElement("input");
  input.setAttribute("type", "hidden");
  input.setAttribute("name", "image");
  input.setAttribute("value", id);
  form.appendChild(input);

  var textarea=document.createElement("textarea");
  textarea.setAttribute("id", focusId);
  textarea.setAttribute("name", "js_caption");
  textarea.setAttribute("cols", 24);
  textarea.setAttribute("rows", 3);
  form.appendChild(textarea);

  // encode node content to b64 to catch all special characters
  var text=document.createTextNode(atob(caption64));
  textarea.appendChild(text);

  var br=document.createElement("br");
  form.appendChild(br);
  
  input=document.createElement("input");
  input.setAttribute("class", "submit");
  input.setAttribute("type", "submit");
  input.setAttribute("value", "Update");
  form.appendChild(input);

  input=document.createElement("input");
  input.setAttribute("class", "reset");
  input.setAttribute("type", "reset");
  input.setAttribute("value", "Cancel");
  input.setAttribute("onclick", "resetNode('"+nodeId+"')");
  form.appendChild(input);

  while (e.hasChildNodes())
    e.removeChild(e.lastChild);
  e.appendChild(form);

  document.getElementById(focusId).focus();
}


/** Clones all hidden input elements from one form to another recursivly
  @param src Source element
  @param dstForm Element of the destination form */
function _clone_hidden_input(src, dstForm)
{
  if (src==null || dstForm==null)
  {
    window.allert("null");
    return;
  }
    
  var i,e;
  for (i=0; i<src.childNodes.length; i++)
  {
    e=src.childNodes[i];
    if (e.nodeType==1 &&
      e.nodeName=="INPUT" && 
      e.getAttribute("type")=="hidden")
      dstForm.appendChild(e.cloneNode(true))
    else
      _clone_hidden_input(e, dstForm);
  }
}

/** Selects all checkboxes
  @param id Id of the refered checkbox
  @param name Name of the checkbox names
*/
function checkbox(id, name)
{
  var cb=document.getElementById(id);
  if (!cb)
    return;
    
  for (var i=0; i<document.forms["formExplorer"].elements.length; i++) {
    var e = document.forms[1].elements[i];
    if (e.name==name && e.type == 'checkbox') {
      e.checked = cb.checked;
    }
  }
}

/** Unchecks all checkboses by an ID
  @param id Ids of the checkboxes */
function uncheck(id)
{
  var cb=document.getElementById(id);
  if (!cb)
    return;
  cb.checked=false;
}

/** Toggle the visibility between two elements. It toggles the style attribute
 * of the node from 'none' with ''. 
  @param fromId First element
  @param toId Second Id */
function toggle_visibility(fromId, toId)
{
  var from=document.getElementById(fromId);
  var to=document.getElementById(toId);

  if (from==null || to==null)
    return;

  if (from.style.display=='none') {
    from.style.display='';
    to.style.display='none';
  } else {
    from.style.display='none';
    to.style.display='';
  }
}

/** Highlight the voting.
  @param id Current voting element
  @param voting Current voting value
  @param i Value of the vote */
function vote_highlight(id, voting, i)
{
  for (j=0; j<=5; j++)
  {
    var s="voting-"+id+"-"+j;
    var e=document.getElementById(s);
    if (!e)
      return;

    var a=e.getAttribute("src");
    if (j<=i) 
      e.setAttribute("src", a.replace(/vote-.*\.png/, "vote-select.png"));
    else if (voting>0 && j<=voting)
      e.setAttribute("src", a.replace(/vote-.*\.png/, "vote-set.png"));
    else
      e.setAttribute("src", a.replace(/vote-.*\.png/, "vote-none.png"));
  }
}

/** Reset the voting stars 
  @param id Id of the current voting
  @param voting Current voting value */
function vote_reset(id, voting)
{
  for (j=0; j<=5; j++) 
  {
    var s="voting-"+id+"-"+j;
    var e=document.getElementById(s);
    if (!e)
      return;

    var a=e.getAttribute("src");
    if (voting>0 && j<=voting)
      e.setAttribute("src", a.replace(/vote-.*\.png/, "vote-set.png"));
    else
      e.setAttribute("src", a.replace(/vote-.*\.png/, "vote-none.png"));
  }
}

/** Return a new hidden input
  @param name
  @param value */
function _new_hidden(name, value)
{
  var input=document.createElement("input");
  input.setAttribute("type", "hidden");
  input.setAttribute("name", name);
  input.setAttribute("value", value);
  return input;
}

/** Returns a new text input 
  @param name
  @param value */
function _new_text(name, value)
{
  var input=document.createElement("input");
  input.setAttribute("type", "text");
  input.setAttribute("name", name);
  if (value!='')
    input.setAttribute("value", value);
  return input;
}

/** Create a new combobox
  @param name
  @param value
  @param checked True of greater zero if the checkbox should be checked */
function _new_cb(name, value, checked)
{
  var input=document.createElement("input");
  input.setAttribute("type", "checkbox");
  input.setAttribute("name", name);
  input.setAttribute("value", value);
  if (checked || checked>0)
    input.setAttribute("checked", "checked");
  return input;
}

function edit_image(id)
{
  var e=document.getElementById('info-'+id);
  if (!e)
    return;

  if (!images[id])
    return;

  var nodeId="info-"+id;
  var focusId="focus-"+id;
  // Does a form already exists?
  // On mozilla, the form will be omitted, check also for the next input node
  if (Data[nodeId]!=null)
  {
    resetNode(nodeId);
    return;
  }

  // Remember old content
  Data[nodeId]=e.cloneNode(true);

  var form=document.createElement("form");
  form.setAttribute("action", "index.php");
  form.setAttribute("method", "post");

  // copy all hidden inputs from formExplorer or formImage
  // whichever exists
  var srcForm;
  if (document.getElementById("formExplorer"))
    srcForm=document.getElementById("formExplorer");
  else
    srcForm=document.getElementById("formImage");
  _clone_hidden_input(srcForm, form);
 
  form.appendChild(_new_hidden('image', id));
  form.appendChild(_new_hidden('js_acl', 1));

  var t=document.createElement('table');
  if (images[id]['gacl']!=null)
    t.appendChild(_get_row_acls(id));
  //t.appendChild(_get_row_date(id));
  t.appendChild(_get_row_tags(id));
  t.appendChild(_get_row_sets(id));
  _append_row_locations(id,t);
  t.appendChild(_get_row_buttons(id));

  while (e.hasChildNodes())
    e.removeChild(e.lastChild);
  form.appendChild(t);
  e.appendChild(form);
  document.getElementById(focusId).focus();
}

function _get_row_acls(id)
{
  var gacl=images[id]['gacl'];
  var oacl=images[id]['oacl'];
  var aacl=images[id]['aacl'];

  var row=document.createElement("tr");
  var th=document.createElement("th");
  th.appendChild(document.createTextNode('ACL:'));
  row.appendChild(th);

  var td=document.createElement('td');
  row.appendChild(td);

  var table=document.createElement("table");
  td.appendChild(table);

  // first row
  var tr=document.createElement("tr");
  
  var td=document.createElement("td");
  tr.appendChild(td);

  td=td.cloneNode(false);
  td.appendChild(document.createTextNode("Friends"));
  tr.appendChild(td);

  td=td.cloneNode(false);
  td.appendChild(document.createTextNode("Members"));
  tr.appendChild(td);

  td=td.cloneNode(false);
  td.appendChild(document.createTextNode("All"));
  tr.appendChild(td);

  table.appendChild(tr);

  // second row
  tr=tr.cloneNode(false);

  td=td.cloneNode(false);
  td.appendChild(document.createTextNode("Edit"));
  tr.appendChild(td);
  
  td=document.createElement('td');
  td.appendChild(_new_cb('js_gacl_edit', 'add', (gacl & 0x01)));
  tr.appendChild(td);
  
  td=document.createElement('td');
  td.appendChild(_new_cb('js_oacl_edit', 'add', (oacl & 0x01)));
  tr.appendChild(td);

  td=document.createElement('td');
  td.appendChild(_new_cb('js_aacl_edit', 'add', (aacl & 0x01)));
  tr.appendChild(td);

  table.appendChild(tr);
  
  // third row
  tr=tr.cloneNode(false);

  td=td.cloneNode(false);
  td.appendChild(document.createTextNode("Preview"));
  tr.appendChild(td);
  
  td=document.createElement('td');
  td.appendChild(_new_cb('js_gacl_preview', 'add', (gacl & 0xf0)));
  tr.appendChild(td);
  
  td=document.createElement('td');
  td.appendChild(_new_cb('js_oacl_preview', 'add', (oacl & 0xf0)));
  tr.appendChild(td);

  td=document.createElement('td');
  td.appendChild(_new_cb('js_aacl_preview', 'add', (aacl & 0xf0)));
  tr.appendChild(td);
  
  table.appendChild(tr);
  return row;
}

/** Row for date
  @param id ID of the image */
function _get_row_date(id)
{
  var tr=document.createElement("tr");

  var th=document.createElement("th");
  th.appendChild(document.createTextNode('Date:'));
  tr.appendChild(th);

  var td=document.createElement("td");
  td.appendChild(_new_text('js_date', images[id]['date']));
  tr.appendChild(td);
  
  return tr;
}

/** Row for tags
  @param id ID of the image */
function _get_row_tags(id)
{
  var tr=document.createElement("tr");

  var th=document.createElement("th");
  th.appendChild(document.createTextNode('Tags:'));
  tr.appendChild(th);

  var td=document.createElement("td");
  input=_new_text('js_tags', images[id]['tags']);
  input.setAttribute('id', 'focus-'+id);
  td.appendChild(input);
  tr.appendChild(td);
  
  return tr;
}

/** Row for sets
  @param id ID of the image */
function _get_row_sets(id)
{
  var tr=document.createElement("tr");

  var th=document.createElement("th");
  th.appendChild(document.createTextNode('Sets:'));
  tr.appendChild(th);

  var td=document.createElement("td");
  td.appendChild(_new_text('js_sets', images[id]['sets']));
  tr.appendChild(td);
  
  return tr;
}

/** Row for sets
  @param id ID of the image */
function _append_row_locations(id, t)
{
  var tr=document.createElement("tr");
  var th=document.createElement("th");
  th.appendChild(document.createTextNode('City:'));
  tr.appendChild(th);

  var td=document.createElement("td");
  td.appendChild(_new_text('js_city', images[id]['city']));
  tr.appendChild(td);
  t.appendChild(tr);

  var tr=document.createElement("tr");
  var th=document.createElement("th");
  th.appendChild(document.createTextNode('Subloc.:'));
  tr.appendChild(th);

  td=document.createElement('td');
  td.appendChild(_new_text('js_sublocation', images[id]['sublocation']));
  tr.appendChild(td);
  t.appendChild(tr);

  var tr=document.createElement("tr");
  var th=document.createElement("th");
  th.appendChild(document.createTextNode('State:'));
  tr.appendChild(th);

  td=document.createElement('td');
  td.appendChild(_new_text('js_state', images[id]['state']));
  tr.appendChild(td);
  t.appendChild(tr);

  var tr=document.createElement("tr");
  var th=document.createElement("th");
  th.appendChild(document.createTextNode('Country:'));
  tr.appendChild(th);

  td=document.createElement('td');
  td.appendChild(_new_text('js_country', images[id]['country']));
  tr.appendChild(td);
  t.appendChild(tr);
}

function _get_row_buttons(id)
{
  var nodeId='info-'+id;
  var tr=document.createElement("tr");
  var th=document.createElement("th");
  tr.appendChild(th);

  var td=document.createElement("td");
  
  var input=document.createElement("input");
  input.setAttribute("class", "submit");
  input.setAttribute("type", "submit");
  input.setAttribute("value", "Update");
  td.appendChild(input);

  var input=document.createElement("input");
  input.setAttribute("class", "reset");
  input.setAttribute("type", "reset");
  input.setAttribute("value", "Cancel");
  input.setAttribute("onclick", "resetNode('"+nodeId+"')");
  td.appendChild(input);
  tr.appendChild(td);

  return tr;
}
