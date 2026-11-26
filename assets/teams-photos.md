# Presenter photos from Microsoft Teams

How to get a leitart.de colleague's Teams profile photo in good quality for
`assets/people/<id>.jpg` (registry: `assets/people.js`).

## Tool: Microsoft Graph Explorer

https://developer.microsoft.com/en-us/graph/graph-explorer

Sign in with your leitart.de account, keep **GET** and **v1.0**, and run one of these queries:

| What | Query |
|---|---|
| Your own photo, largest stored size | `https://graph.microsoft.com/v1.0/me/photo/$value` |
| A colleague's photo, largest stored size | `https://graph.microsoft.com/v1.0/users/<name>@leitart.de/photo/$value` |
| A fixed size of 648 × 648 | `https://graph.microsoft.com/v1.0/users/<name>@leitart.de/photos/648x648/$value` |
| The sizes stored for a person | `https://graph.microsoft.com/v1.0/users/<name>@leitart.de/photos` |

This link opens Graph Explorer with the "own photo" query already filled in:
[graph-explorer?request=me/photo/$value](https://developer.microsoft.com/en-us/graph/graph-explorer?request=me%2Fphoto%2F%24value&method=GET&version=v1.0&GraphUrl=https://graph.microsoft.com)

## Getting the best quality

- `/photo/$value` without a size returns the largest version stored, which is usually
  the one that was uploaded. That's the best you can get.
- 648x648 is the largest fixed size. Smaller ones are 504, 432, 360, 240 and below.

## Saving the image

The photo shows in the **Response preview** tab. Right-click it and choose
"Save image as…", then save it as `assets/people/<id>.jpg` (e.g. `leon-schmidt.jpg`).
The portal expects square images, and Teams photos are square. Add the person to
`assets/people.js` if they are new.

## Permissions

Your own photo works right away. For colleagues' photos, Graph Explorer needs
`User.ReadBasic.All` or `ProfilePhoto.Read.All`. Add it under "Modify permissions" and
consent there. If the tenant blocks user consent, an admin has to approve it once.
